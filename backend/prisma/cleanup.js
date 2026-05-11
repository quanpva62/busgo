const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function main() {
  await p.bookingSeat.deleteMany();
  await p.payment.deleteMany();
  await p.ticket.deleteMany();
  await p.review.deleteMany();
  await p.report.deleteMany();
  await p.tripSeat.deleteMany();
  await p.booking.deleteMany();
  await p.trip.deleteMany();
  console.log("done");
}

main().finally(() => p.$disconnect());
