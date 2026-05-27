const prisma = require("../lib/prisma");
const crypto = require("crypto");
const qs = require("qs");
const { sendTicketEmail } = require("../lib/mailer");
const { notify } = require("../lib/notify");

const buildVnpUrl = (booking, vnpTxnRef, ipAddr) => {
  const date = new Date();
  const createDate = date
    .toISOString()
    .replace(/[-T:.Z]/g, "")
    .slice(0, 14);

  const vnpParams = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: process.env.VNP_TMN_CODE,
    vnp_Amount: booking.totalPrice * 100,
    vnp_CreateDate: createDate,
    vnp_CurrCode: "VND",
    vnp_IpAddr: ipAddr.includes("::ffff:")
      ? ipAddr.replace("::ffff:", "")
      : ipAddr,
    vnp_Locale: "vn",
    vnp_OrderInfo: `Thanh toan booking ${booking.id}`,
    vnp_OrderType: "other",
    vnp_ReturnUrl: process.env.VNP_RETURN_URL,
    vnp_TxnRef: vnpTxnRef,
  };

  // sort và encode values giống VNPay demo
  const sortedParams = {};
  Object.keys(vnpParams)
    .sort()
    .forEach((key) => {
      sortedParams[key] = encodeURIComponent(vnpParams[key]).replace(
        /%20/g,
        "+",
      );
    });

  const signData = qs.stringify(sortedParams, { encode: false });

  const secureHash = crypto
    .createHmac("sha512", process.env.VNP_HASH_SECRET)
    .update(signData)
    .digest("hex");

  sortedParams["vnp_SecureHash"] = secureHash;
  return (
    process.env.VNP_URL + "?" + qs.stringify(sortedParams, { encode: false })
  );
};

const createPayment = async (req, res, next) => {
  try {
    const { bookingId } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) {
      return res.status(404).json({ error: "Booking không tồn tại" });
    }
    if (booking.userId !== req.user.userId) {
      return res
        .status(403)
        .json({ error: "Bạn không có quyền thanh toán cho booking này" });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        error: "Chỉ có thể thanh toán cho booking đang chờ thanh toán",
      });
    }

    // Luôn tạo vnpTxnRef mới để tránh VNPay từ chối transaction cũ
    const vnpTxnRef = `${bookingId}-${Date.now()}`;

    const existingPayment = await prisma.payment.findUnique({
      where: { bookingId },
    });

    if (existingPayment) {
      // Cập nhật lại txnRef mới cho lần retry
      await prisma.payment.update({
        where: { bookingId },
        data: { vnpTxnRef, status: "pending", vnpRaw: {} },
      });
    } else {
      await prisma.payment.create({
        data: {
          bookingId,
          vnpTxnRef,
          amount: booking.totalPrice,
          status: "pending",
          paymentMethod: "vnpay",
          vnpRaw: {},
        },
      });
    }

    const paymentUrl = buildVnpUrl(booking, vnpTxnRef, req.ip || "127.0.0.1");
    res.json({ paymentUrl });
  } catch (error) {
    next(error);
  }
};

const vnpayReturn = async (req, res, next) => {
  try {
    const vnpParams = { ...req.query };
    const secureHash = vnpParams["vnp_SecureHash"];
    delete vnpParams["vnp_SecureHash"];
    delete vnpParams["vnp_SecureHashType"];
    const sortedParams = {};
    Object.keys(vnpParams)
      .sort()
      .forEach((key) => {
        sortedParams[key] = encodeURIComponent(vnpParams[key]).replace(
          /%20/g,
          "+",
        );
      });
    const signData = qs.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac("sha512", process.env.VNP_HASH_SECRET);
    const calculatedHash = hmac.update(signData).digest("hex");

    if (calculatedHash === secureHash) {
      const vnpTxnRef = vnpParams["vnp_TxnRef"];
      const payment = await prisma.payment.findUnique({
        where: { vnpTxnRef },
      });

      if (!payment) {
        return res.status(404).json({ error: "Giao dịch không tồn tại" });
      }
      const bookingId = payment.bookingId;
      const responseCode = vnpParams["vnp_ResponseCode"];

      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      if (responseCode === "00") {
        const bookingMeta = await prisma.booking.findUnique({
          where: { id: bookingId },
          select: { promoId: true, userId: true },
        });

        const ops = [
          prisma.payment.update({
            where: { vnpTxnRef },
            data: {
              status: "successful",
              vnpResponseCode: responseCode,
              vnpRaw: vnpParams,
              paidAt: new Date(),
            },
          }),
          prisma.booking.update({
            where: { id: bookingId },
            data: { status: "paid" },
          }),
          prisma.tripSeat.updateMany({
            where: {
              bookingId: payment.bookingId,
            },
            data: { status: "booked", heldUntil: null },
          }),
          prisma.ticket.create({
            data: {
              bookingId: payment.bookingId,
              ticketCode:
                "BG-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
              qrCode: JSON.stringify({
                bookingId: payment.bookingId,
                vnpTxnRef,
              }),
              isUsed: false,
            },
          }),
        ];

        if (bookingMeta?.promoId) {
          ops.push(
            prisma.promotion.update({
              where: { id: bookingMeta.promoId },
              data: { usedCount: { increment: 1 } },
            }),
            prisma.promoRedemption.create({
              data: {
                promoId: bookingMeta.promoId,
                userId: bookingMeta.userId,
                bookingId: payment.bookingId,
              },
            }),
          );
        }

        const result = await prisma.$transaction(ops);
        const ticket = result[3];

        // Gửi email xác nhận vé (fire-and-forget, không block redirect)
        prisma.booking
          .findUnique({
            where: { id: bookingId },
            include: {
              trip: { include: { route: true } },
              bookingSeats: { include: { seat: { include: { seat: true } } } },
            },
          })
          .then((booking) => {
            if (!booking) return;
            // Notification thanh toán thành công
            notify(
              booking.userId,
              "payment",
              "Thanh toán thành công",
              `Vé ${booking.trip.route.fromCity} → ${booking.trip.route.toCity} đã được xác nhận. Mã vé: ${ticket.ticketCode}`,
            );
            if (!booking.passengerEmail) return;
            const seats = booking.bookingSeats
              .map((bs) => bs.seat.seat.seatLabel)
              .join(", ");
            return sendTicketEmail({
              to: booking.passengerEmail,
              passengerName: booking.passengerName,
              ticketCode: ticket.ticketCode,
              fromCity: booking.trip.route.fromCity,
              toCity: booking.trip.route.toCity,
              departureTime: booking.trip.departureTime,
              seats,
              totalPrice: booking.totalPrice,
            });
          })
          .catch((err) => console.error("Send email failed:", err));

        return res.redirect(
          `${frontendUrl}/payment/result?status=success&bookingId=${bookingId}`,
        );
      } else {
        await prisma.payment.update({
          where: { vnpTxnRef },
          data: {
            status: "failed",
            vnpResponseCode: responseCode,
            vnpRaw: vnpParams,
          },
        });
        return res.redirect(
          `${frontendUrl}/payment/result?status=failed&bookingId=${bookingId}`,
        );
      }
    } else {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      return res.redirect(`${frontendUrl}/payment/result?status=invalid`);
    }
  } catch (error) {
    // vnpayReturn là redirect endpoint — lỗi cũng phải redirect về trang result
    console.error("Error handling VNPAY return:", error);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    return res.redirect(`${frontendUrl}/payment/result?status=failed`);
  }
};

// Gọi VNPay sandbox refund API. Trả về { success, code, message, raw }
const refundVnpay = async ({ payment, refundAmount, ipAddr, createBy }) => {
  const requestId = `${Date.now()}`;
  const createDate = new Date()
    .toISOString()
    .replace(/[-T:.Z]/g, "")
    .slice(0, 14);

  const raw = payment.vnpRaw || {};
  const transactionNo = String(raw.vnp_TransactionNo || "0");
  const transactionDate = String(raw.vnp_PayDate || createDate);
  const orderInfo = `Hoan tien booking ${payment.bookingId}`;
  const transactionType = refundAmount === payment.amount ? "02" : "03";

  const params = {
    vnp_RequestId: requestId,
    vnp_Version: "2.1.0",
    vnp_Command: "refund",
    vnp_TmnCode: process.env.VNP_TMN_CODE,
    vnp_TransactionType: transactionType,
    vnp_TxnRef: payment.vnpTxnRef,
    vnp_Amount: refundAmount * 100,
    vnp_TransactionNo: transactionNo,
    vnp_TransactionDate: transactionDate,
    vnp_CreateBy: createBy,
    vnp_CreateDate: createDate,
    vnp_IpAddr: ipAddr.includes("::ffff:")
      ? ipAddr.replace("::ffff:", "")
      : ipAddr,
    vnp_OrderInfo: orderInfo,
  };

  const hashData = [
    params.vnp_RequestId,
    params.vnp_Version,
    params.vnp_Command,
    params.vnp_TmnCode,
    params.vnp_TransactionType,
    params.vnp_TxnRef,
    params.vnp_Amount,
    params.vnp_TransactionNo,
    params.vnp_TransactionDate,
    params.vnp_CreateBy,
    params.vnp_CreateDate,
    params.vnp_IpAddr,
    params.vnp_OrderInfo,
  ].join("|");

  params.vnp_SecureHash = crypto
    .createHmac("sha512", process.env.VNP_HASH_SECRET)
    .update(hashData)
    .digest("hex");

  const url =
    process.env.VNP_REFUND_URL ||
    "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const data = await response.json();
    return {
      success: data.vnp_ResponseCode === "00",
      code: data.vnp_ResponseCode,
      message: data.vnp_Message,
      raw: data,
    };
  } catch (err) {
    return { success: false, code: "99", message: err.message, raw: null };
  }
};

module.exports = {
  createPayment,
  vnpayReturn,
  refundVnpay,
};
