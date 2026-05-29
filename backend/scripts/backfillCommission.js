require("dotenv").config();
const prisma = require("../src/lib/prisma");

// Backfill commissionAmount cho các booking đã paid trước khi có tính năng commission.
// commissionAmount = totalPrice × company.commissionRate (rate hiện tại của nhà xe).
async function run() {
  console.log("\n=== Backfill commission ===\n");

  const bookings = await prisma.booking.findMany({
    where: { status: "paid", commissionAmount: 0 },
    select: {
      id: true,
      totalPrice: true,
      company: { select: { commissionRate: true } },
    },
  });

  console.log(`Tìm thấy ${bookings.length} booking paid có commissionAmount = 0`);
  if (bookings.length === 0) {
    await prisma.$disconnect();
    return;
  }

  let updated = 0;
  for (const b of bookings) {
    const rate = b.company?.commissionRate ?? 0;
    const commissionAmount = Math.round(b.totalPrice * rate);
    if (commissionAmount === 0) continue; // rate = 0 → bỏ qua
    await prisma.booking.update({
      where: { id: b.id },
      data: { commissionAmount },
    });
    updated++;
  }

  console.log(`✅ Đã cập nhật ${updated} booking`);
  await prisma.$disconnect();
}

run().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
