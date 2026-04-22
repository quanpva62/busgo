const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function createTripSeats(tripId, busId) {
  await prisma.tripSeat.deleteMany({ where: { tripId } });
  const seats = await prisma.seat.findMany({ where: { busId } });
  await prisma.tripSeat.createMany({
    data: seats.map((seat) => ({ tripId, seatId: seat.id, status: "available" })),
  });
}

async function main() {
  const [busStandard, busSleeper, busMinibus] = await Promise.all([
    prisma.bus.findUnique({ where: { licensePlate: "29B-54321" } }),
    prisma.bus.findUnique({ where: { licensePlate: "29B-12345" } }),
    prisma.bus.findUnique({ where: { licensePlate: "29B-67890" } }),
  ]);

  const [driver1, driver2, driver3] = await Promise.all([
    prisma.driver.findUnique({ where: { phone: "0901234567" } }),
    prisma.driver.findUnique({ where: { phone: "0901234569" } }),
    prisma.driver.findUnique({ where: { phone: "0901234560" } }),
  ]);

  const routes = await prisma.route.findMany();
  const routeMap = Object.fromEntries(routes.map((r) => [r.id, r]));

  // Tuyến và config
  const tripConfigs = [
    { routeId: "route-hn-hp", busId: busStandard.id, driverId: driver2.id, hour: 6,  price: 120000, pickup: "Bến xe Mỹ Đình, Hà Nội",   dropoff: "Bến xe Hải Phòng, TP. Hải Phòng" },
    { routeId: "route-hn-hp", busId: busMinibus.id,  driverId: driver3.id, hour: 9,  price: 130000, pickup: "Bến xe Mỹ Đình, Hà Nội",   dropoff: "Bến xe Hải Phòng, TP. Hải Phòng" },
    { routeId: "route-hn-hp", busId: busStandard.id, driverId: driver2.id, hour: 14, price: 120000, pickup: "Bến xe Mỹ Đình, Hà Nội",   dropoff: "Bến xe Hải Phòng, TP. Hải Phòng" },
    { routeId: "route-hn-qn", busId: busSleeper.id,  driverId: driver1.id, hour: 7,  price: 180000, pickup: "Bến xe Gia Lâm, Hà Nội",   dropoff: "Bến xe Bãi Cháy, Quảng Ninh" },
    { routeId: "route-hn-qn", busId: busMinibus.id,  driverId: driver3.id, hour: 13, price: 160000, pickup: "Bến xe Gia Lâm, Hà Nội",   dropoff: "Bến xe Bãi Cháy, Quảng Ninh" },
    { routeId: "route-hn-v",  busId: busSleeper.id,  driverId: driver1.id, hour: 20, price: 250000, pickup: "Bến xe Giáp Bát, Hà Nội",  dropoff: "Bến xe Vinh, Nghệ An" },
    { routeId: "route-hn-th", busId: busStandard.id, driverId: driver2.id, hour: 8,  price: 150000, pickup: "Bến xe Nước Ngầm, Hà Nội", dropoff: "Bến xe Thanh Hóa" },
    { routeId: "route-hn-nd", busId: busMinibus.id,  driverId: driver3.id, hour: 10, price: 90000,  pickup: "Bến xe Mỹ Đình, Hà Nội",   dropoff: "Bến xe Nam Định" },
  ];

  // Tạo cho ngày 23 → 29 tháng 4
  const days = [23, 24, 25, 26, 27, 28, 29];

  for (const day of days) {
    for (const cfg of tripConfigs) {
      const dep = new Date(`2026-04-${String(day).padStart(2, "0")}T${String(cfg.hour).padStart(2, "0")}:00:00+07:00`);
      const route = routeMap[cfg.routeId];
      const arr = new Date(dep.getTime() + route.estimatedDuration * 60000);
      const tripId = `trip-${cfg.routeId}-d${day}-h${cfg.hour}`;

      const trip = await prisma.trip.upsert({
        where: { id: tripId },
        update: {},
        create: {
          id: tripId,
          routeId: cfg.routeId,
          busId: cfg.busId,
          driverId: cfg.driverId,
          departureTime: dep,
          arrivalTime: arr,
          price: cfg.price,
          status: "scheduled",
          pickupAddress: cfg.pickup,
          dropoffAddress: cfg.dropoff,
        },
      });

      await createTripSeats(trip.id, cfg.busId);
      console.log(`✅ ${trip.id}`);
    }
  }

  console.log("Done!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
