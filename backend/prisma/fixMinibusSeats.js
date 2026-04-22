const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const bus = await prisma.bus.findUnique({ where: { licensePlate: "29B-67890" } });
  if (!bus) { console.log("Bus not found"); return; }

  const oldSeats = await prisma.seat.findMany({ where: { busId: bus.id } });
  await prisma.tripSeat.deleteMany({ where: { seatId: { in: oldSeats.map(s => s.id) } } });
  await prisma.seat.deleteMany({ where: { busId: bus.id } });
  console.log("✅ Deleted old seats");

  // Layout mới: tài xế ở row 1 col 1 (không phải ghế)
  // row 1: 2 ghế (col 2, 3)
  // row 2-4: 3 ghế (col 1, 2, 3)
  // row 5: 4 ghế (col 1, 2, 3, 4)
  const seatData = [
    { seatLabel: "01", rowNum: 1, colNum: 2 },
    { seatLabel: "02", rowNum: 1, colNum: 3 },
    { seatLabel: "03", rowNum: 2, colNum: 1 },
    { seatLabel: "04", rowNum: 2, colNum: 2 },
    { seatLabel: "05", rowNum: 2, colNum: 3 },
    { seatLabel: "06", rowNum: 3, colNum: 1 },
    { seatLabel: "07", rowNum: 3, colNum: 2 },
    { seatLabel: "08", rowNum: 3, colNum: 3 },
    { seatLabel: "09", rowNum: 4, colNum: 1 },
    { seatLabel: "10", rowNum: 4, colNum: 2 },
    { seatLabel: "11", rowNum: 4, colNum: 3 },
    { seatLabel: "12", rowNum: 5, colNum: 1 },
    { seatLabel: "13", rowNum: 5, colNum: 2 },
    { seatLabel: "14", rowNum: 5, colNum: 3 },
    { seatLabel: "15", rowNum: 5, colNum: 4 },
  ];

  for (const s of seatData) {
    await prisma.seat.create({ data: { busId: bus.id, ...s } });
  }
  console.log("✅ Created 15 seats");

  // Cập nhật totalSeats
  await prisma.bus.update({ where: { id: bus.id }, data: { totalSeats: 15 } });
  console.log("✅ Updated totalSeats = 15");

  const trips = await prisma.trip.findMany({ where: { busId: bus.id } });
  const newSeats = await prisma.seat.findMany({ where: { busId: bus.id } });

  for (const trip of trips) {
    await prisma.tripSeat.deleteMany({ where: { tripId: trip.id } });
    await prisma.tripSeat.createMany({
      data: newSeats.map(seat => ({ tripId: trip.id, seatId: seat.id, status: "available" })),
    });
    console.log(`✅ TripSeats: ${trip.id}`);
  }

  console.log("Done!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
