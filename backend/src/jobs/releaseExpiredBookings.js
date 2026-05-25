const prisma = require("../lib/prisma");

async function releaseExpiredBookings() {
  const expired = await prisma.booking.findMany({
    where: { status: "pending", expiresAt: { lt: new Date() } },
    select: { id: true },
  });
  if (expired.length === 0) return;

  const ids = expired.map((b) => b.id);
  await prisma.$transaction([
    prisma.booking.updateMany({
      where: { id: { in: ids } },
      data: { status: "cancelled" },
    }),
    prisma.tripSeat.updateMany({
      where: { bookingId: { in: ids } },
      data: { status: "available", bookingId: null, heldUntil: null },
    }),
  ]);
}

module.exports = releaseExpiredBookings;
