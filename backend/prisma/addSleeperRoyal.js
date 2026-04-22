const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.findUnique({ where: { email: "contact@busgo.vn" } });
  const driver = await prisma.driver.findUnique({ where: { phone: "0901234567" } });

  // Tạo bus Royal 24 cabin
  const busRoyal = await prisma.bus.upsert({
    where: { licensePlate: "29B-11111" },
    update: {},
    create: {
      companyId: company.id,
      licensePlate: "29B-11111",
      busType: "sleeper",
      typeName: "Giường nằm Royal 24",
      totalSeats: 24,
      layout: "1-1",
      amenities: { wifi: true, airConditioner: true, usb: true, blanket: true, water: true },
    },
  });
  console.log("✅ Bus Royal:", busRoyal.licensePlate);

  // Tạo ghế: 2 cols × 6 rows × 2 tầng = 24
  const oldSeats = await prisma.seat.findMany({ where: { busId: busRoyal.id } });
  if (oldSeats.length > 0) {
    await prisma.tripSeat.deleteMany({ where: { seatId: { in: oldSeats.map(s => s.id) } } });
    await prisma.seat.deleteMany({ where: { busId: busRoyal.id } });
  }

  const cols = ["A", "B"];
  for (let floor = 1; floor <= 2; floor++) {
    for (let row = 1; row <= 6; row++) {
      for (let i = 0; i < cols.length; i++) {
        await prisma.seat.create({
          data: {
            busId: busRoyal.id,
            seatLabel: `${cols[i]}${row}-T${floor}`,
            rowNum: row,
            colNum: i + 1,
            floor,
            level: floor === 1 ? "lower" : "upper",
          },
        });
      }
    }
  }
  console.log("✅ Created 24 sleeper seats (2 cols × 6 rows × 2 floors)");

  // Tạo trips ngày 23-29/4 tuyến HN→Vinh
  const route = await prisma.route.findUnique({ where: { id: "route-hn-v" } });
  const seats = await prisma.seat.findMany({ where: { busId: busRoyal.id } });
  const days = [23, 24, 25, 26, 27, 28, 29];

  for (const day of days) {
    const dep = new Date(`2026-04-${String(day).padStart(2, "0")}T21:00:00+07:00`);
    const arr = new Date(dep.getTime() + route.estimatedDuration * 60000);
    const tripId = `trip-royal-hn-v-d${day}`;

    const trip = await prisma.trip.upsert({
      where: { id: tripId },
      update: {},
      create: {
        id: tripId,
        routeId: route.id,
        busId: busRoyal.id,
        driverId: driver.id,
        departureTime: dep,
        arrivalTime: arr,
        price: 350000,
        status: "scheduled",
        pickupAddress: "Bến xe Giáp Bát, Hà Nội",
        dropoffAddress: "Bến xe Vinh, Nghệ An",
      },
    });

    await prisma.tripSeat.deleteMany({ where: { tripId: trip.id } });
    await prisma.tripSeat.createMany({
      data: seats.map(s => ({ tripId: trip.id, seatId: s.id, status: "available" })),
    });
    console.log(`✅ ${trip.id}`);
  }

  console.log("Done!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
