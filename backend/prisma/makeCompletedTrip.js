const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Tìm 1 booking có status "paid" để test review
  const booking = await prisma.booking.findFirst({
    where: { status: "paid" },
    include: { trip: true },
  });

  if (!booking) {
    console.log("Không tìm thấy booking nào có status 'paid'.");
    console.log("Hãy thực hiện thanh toán 1 booking trước rồi chạy lại script này.");
    return;
  }

  await prisma.trip.update({
    where: { id: booking.tripId },
    data: { status: "completed" },
  });

  console.log(`✅ Trip ${booking.tripId} đã được đặt thành 'completed'`);
  console.log(`✅ Booking ${booking.id} (${booking.passengerName}) đủ điều kiện đánh giá`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
