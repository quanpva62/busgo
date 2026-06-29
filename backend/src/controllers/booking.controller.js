const prisma = require("../lib/prisma");
const { refundVnpay } = require("./payment.controller");
const { notify } = require("../lib/notify");

const createBooking = async (req, res, next) => {
  try {
    const {
      tripId,
      seatIds,
      passengerName,
      passengerPhone,
      passengerEmail,
      promoCode,
    } = req.body;

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { bus: true },
    });
    if (!trip) {
      return res.status(404).json({ error: "Chuyến đi không tồn tại" });
    }
    if (trip.status !== "scheduled") {
      return res
        .status(400)
        .json({ error: "Chuyến đi không khả dụng để đặt vé" });
    }
    // Huỷ booking pending cũ của user trên cùng chuyến (nếu có) → giải phóng ghế
    const oldPending = await prisma.booking.findFirst({
      where: { userId: req.user.userId, tripId, status: "pending" },
      select: { id: true },
    });
    if (oldPending) {
      await prisma.$transaction([
        prisma.booking.update({
          where: { id: oldPending.id },
          data: { status: "cancelled" },
        }),
        prisma.tripSeat.updateMany({
          where: { bookingId: oldPending.id },
          data: { status: "available", bookingId: null, heldUntil: null },
        }),
      ]);
    }

    const tripSeats = await prisma.tripSeat.findMany({
      where: { tripId, id: { in: seatIds } },
    });
    if (tripSeats.length !== seatIds.length) {
      return res.status(400).json({
        error: "Một hoặc nhiều seatId không tồn tại trên chuyến đi này",
      });
    }
    if (tripSeats.some((seat) => seat.status !== "available")) {
      return res.status(400).json({ error: "Một hoặc nhiều ghế đã được đặt" });
    }

    const totalPrice = trip.price * seatIds.length;
    let discountAmount = 0;
    let promoId = null;

    if (promoCode) {
      const promo = await prisma.promotion.findUnique({
        where: { code: promoCode },
      });

      if (!promo || !promo.isActive) {
        return res.status(400).json({
          error: "Mã khuyến mãi không hợp lệ hoặc không còn hiệu lực",
        });
      }
      if (promo.expiresAt < new Date()) {
        return res.status(400).json({ error: "Mã khuyến mãi đã hết hạn" });
      }
      if (promo.maxUses && promo.usedCount >= promo.maxUses) {
        return res
          .status(400)
          .json({ error: "Mã khuyến mãi đã hết lượt sử dụng" });
      }

      const paidBookingCount = await prisma.booking.count({
        where: {
          userId: req.user.userId,
          status: "paid",
        },
      });
      if (promo.firstBookingOnly && paidBookingCount > 0) {
        return res
          .status(400)
          .json({ error: "Mã khuyến mãi chỉ áp dụng cho đơn hàng đầu tiên" });
      }

      if (promo.minBookings && paidBookingCount < promo.minBookings) {
        return res.status(400).json({
          error: `Mã khuyến mãi yêu cầu ít nhất ${promo.minBookings} đơn hàng đã thanh toán`,
        });
      }

      if (promo.oncePerUser) {
        const used = await prisma.promoRedemption.findUnique({
          where: {
            promoId_userId: { promoId: promo.id, userId: req.user.userId },
          },
        });
        if (used) {
          return res.status(400).json({
            error: "Mã khuyến mãi này đã được sử dụng!",
          });
        }
      }

      if (promo.minPrice && totalPrice < promo.minPrice) {
        return res.status(400).json({
          error: `Mã khuyến mãi yêu cầu giá trị đơn hàng tối thiểu ${promo.minPrice.toLocaleString("vi-VN")}đ`,
        });
      }
      if (promo.discountType === "percentage") {
        discountAmount = Math.round(totalPrice * (promo.discountValue / 100));
      } else if (promo.discountType === "fixed") {
        discountAmount = promo.discountValue;
      }
      discountAmount = Math.min(discountAmount, totalPrice);

      promoId = promo.id;
    }

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const booking = await prisma.$transaction(async (tx) => {
      // Lock + check trong cùng 1 câu UPDATE — atomic
      // Chỉ update những ghế CÒN available, đếm số rows bị update
      const locked = await tx.tripSeat.updateMany({
        where: {
          id: { in: tripSeats.map((ts) => ts.id) },
          status: "available", // chỉ match nếu vẫn còn trống
        },
        data: { status: "held", heldUntil: expiresAt },
      });

      // Nếu số ghế lock được < số ghế yêu cầu → có người đặt trước rồi
      if (locked.count !== seatIds.length) {
        throw new Error("Một hoặc nhiều ghế vừa được đặt bởi người khác");
      }

      const newBooking = await tx.booking.create({
        data: {
          userId: req.user.userId,
          tripId,
          promoId,
          totalPrice: totalPrice - discountAmount,
          discountAmount,
          passengerName,
          passengerPhone,
          passengerEmail,
          pickupAddress: trip.pickupAddress,
          dropoffAddress: trip.dropoffAddress,
          companyId: trip.bus.companyId,
          expiresAt,
        },
      });

      await tx.bookingSeat.createMany({
        data: tripSeats.map((ts) => ({
          bookingId: newBooking.id,
          seatId: ts.id,
          tripId,
        })),
      });

      await tx.tripSeat.updateMany({
        where: { id: { in: tripSeats.map((ts) => ts.id) } },
        data: { bookingId: newBooking.id },
      });

      return newBooking;
    });
    res.status(201).json({
      message: "Đặt vé thành công. Vui lòng thanh toán trong vòng 15 phút.",
      booking,
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    next(error);
  }
};

const getBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        trip: { include: { route: true } },
        bookingSeats: { include: { seat: { include: { seat: true } } } },
      },
    });
    if (!booking) {
      return res.status(404).json({ error: "Không tìm thấy booking" });
    }
    if (booking.userId !== req.user.userId) {
      return res
        .status(403)
        .json({ error: "Bạn không có quyền xem booking này" });
    }
    res.status(200).json({ booking });
  } catch (error) {
    next(error);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { trip: true, payment: true },
    });
    if (!booking)
      return res.status(404).json({ error: "Booking không tồn tại" });
    if (booking.userId !== req.user.userId)
      return res
        .status(403)
        .json({ error: "Bạn không có quyền hủy booking này" });
    if (booking.status === "cancelled" || booking.status === "refunded")
      return res.status(400).json({ error: "Booking đã được hủy trước đó" });
    if (booking.status !== "pending" && booking.status !== "paid")
      return res.status(400).json({ error: "Không thể hủy booking này" });

    const hoursUntilDeparture =
      (new Date(booking.trip.departureTime) - new Date()) / (1000 * 60 * 60);

    let refundAmount = 0;
    let refundNote = "";

    if (booking.status === "pending") {
      refundAmount = 0;
      refundNote = "Chưa thanh toán, không cần hoàn tiền";
    } else if (hoursUntilDeparture > 24) {
      refundAmount = booking.totalPrice;
      refundNote = "Hoàn 100% — huỷ trước 24 giờ";
    } else if (hoursUntilDeparture > 12) {
      refundAmount = Math.round(booking.totalPrice * 0.5);
      refundNote = "Hoàn 50% — huỷ trong khoảng 12-24 giờ trước khởi hành";
    } else {
      refundAmount = 0;
      refundNote = "Không hoàn tiền — huỷ dưới 12 giờ trước khởi hành";
    }

    // Gọi VNPay refund nếu cần hoàn tiền (API ngoài — phải gọi TRƯỚC transaction)
    let refundRes = null;
    if (booking.status === "paid" && refundAmount > 0) {
      if (!booking.payment || booking.payment.status !== "successful") {
        return res
          .status(400)
          .json({ error: "Không tìm thấy giao dịch thanh toán hợp lệ" });
      }
      refundRes = await refundVnpay({
        payment: booking.payment,
        refundAmount,
        ipAddr: req.ip || "127.0.0.1",
        createBy: req.user.userId,
      });
      if (!refundRes.success) {
        // Hoàn tiền thất bại → đánh dấu refund_failed để xử lý tay (nhất quán với luồng admin)
        await prisma.booking.update({
          where: { id },
          data: { status: "refund_failed" },
        });
        return res.status(502).json({
          error: `Hoàn tiền VNPay thất bại: ${refundRes.message || refundRes.code}`,
        });
      }
    }

    const newStatus =
      booking.status === "paid" && refundAmount > 0 ? "refunded" : "cancelled";

    // Update booking + tripSeat + payment cùng 1 transaction — atomic
    try {
      await prisma.$transaction(async (tx) => {
        await tx.booking.update({
          where: { id },
          data: { status: newStatus, commissionAmount: 0 },
        });
        await tx.tripSeat.updateMany({
          where: { bookingId: id },
          data: { status: "available", bookingId: null, heldUntil: null },
        });
        if (refundRes) {
          await tx.payment.update({
            where: { id: booking.payment.id },
            data: {
              status: "refunded",
              vnpRaw: { ...booking.payment.vnpRaw, refund: refundRes.raw },
            },
          });
        }
      });
    } catch (txErr) {
      // Tiền có thể đã hoàn nhưng ghi DB lỗi → cảnh báo để đối soát/xử lý tay
      if (refundRes) {
        console.error(
          `[cancelBooking] CRITICAL: refund VNPay thành công nhưng cập nhật DB thất bại cho booking ${id}. Cần đối soát thủ công.`,
          txErr,
        );
      }
      throw txErr;
    }

    notify(
      booking.userId,
      "booking",
      newStatus === "refunded" ? "Đã huỷ vé & hoàn tiền" : "Đã huỷ vé",
      refundAmount > 0
        ? `Vé đã huỷ. ${refundNote}: ${refundAmount.toLocaleString("vi-VN")}đ`
        : `Vé đã huỷ. ${refundNote}`,
    );

    res.status(200).json({
      message: "Hủy booking thành công",
      refundAmount,
      refundNote,
      status: newStatus,
    });
  } catch (error) {
    next(error);
  }
};
const getMyBookings = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // Lazy expiry: cancel các booking pending đã quá hạn + trả ghế về available
    const expired = await prisma.booking.findMany({
      where: { userId, status: "pending", expiresAt: { lt: new Date() } },
      select: { id: true },
    });
    if (expired.length > 0) {
      const expiredIds = expired.map((b) => b.id);
      await prisma.$transaction([
        prisma.booking.updateMany({
          where: { id: { in: expiredIds } },
          data: { status: "cancelled" },
        }),
        prisma.tripSeat.updateMany({
          where: { bookingId: { in: expiredIds } },
          data: { status: "available", bookingId: null, heldUntil: null },
        }),
      ]);
    }

    const bookings = await prisma.booking.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        trip: { include: { route: true } },
        bookingSeats: {
          include: { seat: { include: { seat: true } } }, // TripSeat → Seat
        },
        reports: {
          select: {
            id: true,
            category: true,
            severity: true,
            status: true,
            createdAt: true,
          },
        },
        review: {
          select: { id: true, rating: true, comment: true, createdAt: true },
        },
      },
    });
    res.json(bookings);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getBooking,
  cancelBooking,
  getMyBookings,
};
