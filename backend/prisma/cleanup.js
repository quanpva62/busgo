const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function main() {
  // TRUNCATE CASCADE: xóa tất cả + dependencies, bỏ qua thứ tự FK
  await p.$executeRawUnsafe(`
    TRUNCATE TABLE
      "BookingSeat",
      "Payment",
      "Ticket",
      "Review",
      "Report",
      "TripSeat",
      "Booking",
      "Trip"
    RESTART IDENTITY CASCADE;
  `);
  console.log("done");
}

main().finally(() => p.$disconnect());
