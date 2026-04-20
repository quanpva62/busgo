const prisma = require("../lib/prisma");
const crypto = require("crypto");
const qs = require("qs");

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

const createPayment = async (req, res) => {
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

    // check nếu đã có payment pending
    const existingPayment = await prisma.payment.findUnique({
      where: { bookingId },
    });
    if (existingPayment && existingPayment.status === "pending") {
      const paymentUrl = buildVnpUrl(
        booking,
        existingPayment.vnpTxnRef,
        req.ip || "127.0.0.1",
      );
      return res.json({ paymentUrl });
    }

    // tạo payment mới
    const vnpTxnRef = `${bookingId}-${Date.now()}`;
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

    const paymentUrl = buildVnpUrl(booking, vnpTxnRef, req.ip || "127.0.0.1");
    res.json({ paymentUrl });
  } catch (error) {
    console.error("Error creating payment:", error);
    return res.status(500).json({ error: "Lỗi máy chủ" });
  }
};

const vnpayReturn = async (req, res) => {
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
    console.log("signData for return:", signData);
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
        await prisma.$transaction([
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
            where: { bookingId: payment.bookingId },
            data: { status: "booked", heldUntil: null },
          }),
          prisma.ticket.create({
            data: {
              bookingId: payment.bookingId,
              ticketCode:
                "BG-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
              qrCode: JSON.stringify({ bookingId: payment.bookingId, vnpTxnRef }),
              isUsed: false,
            },
          }),
        ]);
        return res.redirect(`${frontendUrl}/payment/result?status=success&bookingId=${bookingId}`);
      } else {
        await prisma.payment.update({
          where: { vnpTxnRef },
          data: { status: "failed", vnpResponseCode: responseCode, vnpRaw: vnpParams },
        });
        return res.redirect(`${frontendUrl}/payment/result?status=failed&bookingId=${bookingId}`);
      }
    } else {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      return res.redirect(`${frontendUrl}/payment/result?status=invalid`);
    }
  } catch (error) {
    console.error("Error handling VNPAY return:", error);
    return res.status(500).json({ error: "Lỗi máy chủ" });
  }
};

module.exports = {
  createPayment,
  vnpayReturn,
};
