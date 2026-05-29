const prisma = require("../src/lib/prisma");
const bcrypt = require("bcryptjs");

// Xoá sạch data giữa các test (CASCADE lo thứ tự FK)
async function resetDb() {
  const tables = [
    "PromoRedemption",
    "Notification",
    "Review",
    "Report",
    "Ticket",
    "Payment",
    "BookingSeat",
    "Booking",
    "TripSeat",
    "Trip",
    "Seat",
    "Driver",
    "Bus",
    "Route",
    "Promotion",
    "User",
    "Company",
  ];
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${tables.map((t) => `"${t}"`).join(", ")} RESTART IDENTITY CASCADE;`,
  );
}

// Tạo 1 user (mặc định: role user, đã verify email)
async function seedUser(overrides = {}) {
  const passwordHash = await bcrypt.hash(overrides.password ?? "Password123", 10);
  return prisma.user.create({
    data: {
      email: overrides.email ?? `user${Date.now()}@test.com`,
      phone: overrides.phone ?? `09${Math.floor(10000000 + Math.random() * 89999999)}`,
      fullName: overrides.fullName ?? "Test User",
      passwordHash,
      emailVerified: true,
      role: overrides.role ?? "user",
      companyId: overrides.companyId ?? null,
    },
  });
}

// Tạo 1 chuyến đầy đủ (company + bus + driver + route + trip + N ghế available)
async function seedTrip({ price = 200000, seatCount = 4, commissionRate = 0.1 } = {}) {
  const company = await prisma.company.create({
    data: {
      name: "Nhà xe Test",
      hotline: "1900",
      email: `co${Date.now()}@test.com`,
      address: "HCM",
      commissionRate,
    },
  });
  const bus = await prisma.bus.create({
    data: {
      licensePlate: `51B-${Math.floor(1000 + Math.random() * 8999)}`,
      busType: "standard",
      typeName: "Ghế ngồi",
      totalSeats: seatCount,
      layout: "2-2",
      amenities: [],
      companyId: company.id,
    },
  });
  const driver = await prisma.driver.create({
    data: {
      fullName: "Tài xế Test",
      phone: `08${Math.floor(10000000 + Math.random() * 89999999)}`,
      companyId: company.id,
      busId: bus.id,
    },
  });
  const route = await prisma.route.create({
    data: { fromCity: "HCM", toCity: "Đà Lạt", distanceKm: 300, estimatedDuration: 360 },
  });
  const trip = await prisma.trip.create({
    data: {
      routeId: route.id,
      busId: bus.id,
      driverId: driver.id,
      departureTime: new Date(Date.now() + 3 * 24 * 3600 * 1000), // +3 ngày
      arrivalTime: new Date(Date.now() + 3 * 24 * 3600 * 1000 + 6 * 3600 * 1000),
      price,
      pickupAddress: "Bến xe Miền Đông",
      dropoffAddress: "Bến xe Đà Lạt",
      status: "scheduled",
    },
  });
  // Tạo ghế + tripSeat available
  const tripSeats = [];
  for (let i = 0; i < seatCount; i++) {
    const seat = await prisma.seat.create({
      data: { busId: bus.id, seatLabel: `A${i + 1}`, rowNum: i + 1, colNum: 1 },
    });
    const ts = await prisma.tripSeat.create({
      data: { tripId: trip.id, seatId: seat.id, status: "available" },
    });
    tripSeats.push(ts);
  }
  return { company, bus, driver, route, trip, tripSeats };
}

module.exports = { resetDb, seedUser, seedTrip };
