const prisma = require("../lib/prisma");
const {
  queryVnpayDR,
  finalizePayment,
} = require("../controllers/payment.controller");

async function reconcilePendingPayments() {
  const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000);

  const payments = await prisma.payment.findMany({
    where: {
      status: "pending",
      createdAt: {
        lt: twoMinAgo,
      },
      booking: { status: "pending" },
    },
    take: 30,
  });

  if (payments.length === 0) return;

  for (const payment of payments) {
    try {
      const result = await queryVnpayDR(payment);
      if (result.paid) {
        await finalizePayment(payment, result.raw);
        console.log(`[reconcile] Đã chốt đơn ${payment.vnpTxnRef} thành công`);
      }
    } catch (error) {
      console.error(
        `[reconcile] Lỗi khi xử lý đơn ${payment.vnpTxnRef}:`,
        error.message,
      );
    }
  }
}

module.exports = {
  reconcilePendingPayments,
};
