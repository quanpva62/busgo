const prisma = require("../lib/prisma");

const createBooking = async (req, res) => {
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
      return res.status(404).json({ error: "Trip không tồn tại" });
    }
    if (trip.status !== "scheduled") {
      return res.status(400).json({ error: "Trip không khả dụng để đặt vé" });
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

      if (promo.discountType === "percentage") {
        discountAmount = totalPrice * (promo.discountValue / 100);
      } else if (promo.discountType === "fixed") {
        discountAmount = promo.discountValue;
      }

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
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

const getBooking = async (req, res) => {
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
      return res.status(403).json({ error: "Bạn không có quyền xem booking này" });
    }
    res.status(200).json({ booking });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await prisma.booking.findUnique({
      where: { id },
    });
    if (!booking) {
      return res.status(404).json({ error: "Booking không tồn tại" });
    }
    if (booking.userId !== req.user.userId) {
      return res
        .status(403)
        .json({ error: "Bạn không có quyền hủy booking này" });
    }
    if (booking.status !== "pending") {
      return res
        .status(400)
        .json({ error: "Chỉ có thể hủy booking đang chờ thanh toán" });
    }
    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id },
        data: { status: "cancelled" },
      });
      await tx.tripSeat.updateMany({
        where: { bookingId: id },
        data: { status: "available", bookingId: null, heldUntil: null },
      });
    });
    res.status(200).json({ message: "Hủy booking thành công" });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};
const getMyBookings = async (req, res) => {
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
      },
    });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createBooking,
  getBooking,
  cancelBooking,
  getMyBookings,
};
