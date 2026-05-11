const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function main() {
  const users = await p.user.findMany({
    where: { role: { in: ["admin", "company_admin"] } },
    select: { email: true, role: true },
  });
  console.log(users);
  const bookings = await p.booking.count();
  console.log("Bookings:", bookings);
}

main().finally(() => p.$disconnect());
