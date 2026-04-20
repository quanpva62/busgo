const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function createStandardSeats(busId) {
  const seats = await prisma.seat.findMany({ where: { busId } });
  const seatIds = seats.map((s) => s.id);
  await prisma.tripSeat.deleteMany({ where: { seatId: { in: seatIds } } });
  await prisma.seat.deleteMany({ where: { busId } });
  const cols = ["A", "B", "C", "D"];

  for (let row = 1; row <= 6; row++) {
    for (let i = 0; i < cols.length; i++) {
      const seatLabel = `${cols[i]}${row}`;
      await prisma.seat.create({
        data: {
          busId,
          seatLabel,
          rowNum: row,
          colNum: i + 1,
        },
      });
    }
  }
  const lastRowCols = ["A", "B", "C", "D", "E"];
  for (let i = 0; i < lastRowCols.length; i++) {
    const seatLabel = `${lastRowCols[i]}7`;
    await prisma.seat.create({
      data: {
        busId,
        seatLabel,
        rowNum: 7,
        colNum: i + 1,
      },
    });
  }
  console.log("✅ Standard seats created");
}

async function createMinibusSeats(busId) {
  const seats = await prisma.seat.findMany({ where: { busId } });
  const seatIds = seats.map((s) => s.id);
  await prisma.tripSeat.deleteMany({ where: { seatId: { in: seatIds } } });
  await prisma.seat.deleteMany({ where: { busId } });
  const cols = ["A", "B", "C", "D"];
  for (let row = 1; row <= 4; row++) {
    for (let i = 0; i < cols.length; i++) {
      const seatLabel = `${cols[i]}${row}`;
      await prisma.seat.create({
        data: {
          busId,
          seatLabel,
          rowNum: row,
          colNum: i + 1,
        },
      });
    }
  }
  const lastRowCols = ["A", "B", "C", "D", "E"];
  for (let i = 0; i < lastRowCols.length; i++) {
    const seatLabel = `${lastRowCols[i]}5`;
    await prisma.seat.create({
      data: {
        busId,
        seatLabel,
        rowNum: 5,
        colNum: i + 1,
      },
    });
  }
  console.log("✅ Minibus seats created");
}

async function createSleeperSeats(busId) {
  const seats = await prisma.seat.findMany({ where: { busId } });
  const seatIds = seats.map((s) => s.id);
  await prisma.tripSeat.deleteMany({ where: { seatId: { in: seatIds } } });
  await prisma.seat.deleteMany({ where: { busId } });

  const cols = ["A", "B", "C"];

  for (let floor = 1; floor <= 2; floor++) {
    for (let row = 1; row <= 6; row++) {
      for (let i = 0; i < cols.length; i++) {
        const seatLabel = `${cols[i]}${row}-T${floor}`;
        await prisma.seat.create({
          data: {
            busId,
            seatLabel,
            rowNum: row,
            colNum: i + 1,
            floor,
            level: floor === 1 ? "lower" : "upper",
          },
        });
      }
    }
  }
  console.log("✅ Sleeper seats created");
}
async function createTripSeats(tripId, busId) {
  // Xoá TripSeats cũ của chuyến này trước
  await prisma.tripSeat.deleteMany({ where: { tripId } });

  // Lấy tất cả ghế của xe
  const seats = await prisma.seat.findMany({ where: { busId } });

  // Tạo TripSeat cho từng ghế
  await prisma.tripSeat.createMany({
    data: seats.map((seat) => ({
      tripId,
      seatId: seat.id,
      status: "available",
    })),
  });

  console.log(`✅ TripSeats created: ${seats.length} ghế`);
}
async function main() {
  console.log("Seeding...");

  // 1. Company
  const company = await prisma.company.upsert({
    where: { email: "contact@busgo.vn" },
    update: {},
    create: {
      name: "BusGo",
      hotline: "1900 6789",
      email: "contact@busgo.vn",
      address: "86 Lê Trọng Tấn, Hà Nội",
      description: "Nhà xe BusGo - Chuyên tuyến miền Bắc",
    },
  });
  console.log("✅ Company:", company.name);

  const busSleeper = await prisma.bus.upsert({
    where: { licensePlate: "29B-12345" },
    update: {},
    create: {
      companyId: company.id,
      licensePlate: "29B-12345",
      busType: "sleeper",
      typeName: "Giường nằm 2 tầng",
      totalSeats: 36,
      layout: "2-1",
      amenities: {
        wifi: true,
        airConditioner: true,
        usb: true,
        blanket: true,
        water: true,
      },
    },
  });
  console.log("✅ Bus sleeper:", busSleeper.licensePlate);

  const busStandard = await prisma.bus.upsert({
    where: { licensePlate: "29B-54321" },
    update: {},
    create: {
      companyId: company.id,
      licensePlate: "29B-54321",
      busType: "standard",
      typeName: "Xe khách 29 chỗ",
      totalSeats: 29,
      layout: "2-2",
      amenities: {
        wifi: true,
        airConditioner: true,
        usb: true,
        blanket: true,
        water: true,
      },
    },
  });
  console.log("✅ Bus standard:", busStandard.licensePlate);

  const busMinibus = await prisma.bus.upsert({
    where: { licensePlate: "29B-67890" },
    update: {},
    create: {
      companyId: company.id,
      licensePlate: "29B-67890",
      busType: "minibus",
      typeName: "Xe khách 16 chỗ",
      totalSeats: 16,
      layout: "2-2",
      amenities: {
        wifi: true,
        airConditioner: true,
        usb: true,
        blanket: true,
        water: true,
      },
    },
  });
  console.log("✅ Bus minibus:", busMinibus.licensePlate);

  const driver1 = await prisma.driver.upsert({
    where: { phone: "0901234567" },
    update: {},
    create: {
      companyId: company.id,
      busId: busSleeper.id,
      fullName: "Nguyễn Văn An",
      phone: "0901234567",
      driverRole: "driver",
      licenseType: "B2",
      joinDate: new Date("2020-01-01"),
      licenseNo: "123123123123",
    },
  });
  console.log("✅ Driver:", driver1.fullName);

  const driver2 = await prisma.driver.upsert({
    where: { phone: "0901234569" },
    update: {},
    create: {
      companyId: company.id,
      busId: busStandard.id,
      fullName: "Trần Thị Bình",
      phone: "0901234569",
      driverRole: "driver",
      licenseType: "B2",
      joinDate: new Date("2020-01-01"),
      licenseNo: "321321321321",
    },
  });
  console.log("✅ Driver:", driver2.fullName);

  const driver3 = await prisma.driver.upsert({
    where: { phone: "0901234560" },
    update: {},
    create: {
      companyId: company.id,
      busId: busMinibus.id,
      fullName: "Lê Văn C",
      phone: "0901234560",
      driverRole: "driver",
      licenseType: "B2",
      joinDate: new Date("2020-01-01"),
      licenseNo: "456456456456",
    },
  });
  console.log("✅ Driver:", driver3.fullName);

  const assistant1 = await prisma.driver.upsert({
    where: { phone: "0901234570" },
    update: {},
    create: {
      companyId: company.id,
      busId: busSleeper.id,
      fullName: "Phạm Thị D",
      phone: "0901234570",
      driverRole: "assistant",
      joinDate: new Date("2020-01-01"),
    },
  });
  console.log("✅ Assistant:", assistant1.fullName);

  // Routes
  const routes = await Promise.all([
    prisma.route.upsert({
      where: { id: "route-hn-hp" },
      update: {},
      create: {
        id: "route-hn-hp",
        fromCity: "Hà Nội",
        toCity: "Hải Phòng",
        distanceKm: 120,
        estimatedDuration: 150,
      },
    }),
    prisma.route.upsert({
      where: { id: "route-hn-qn" },
      update: {},
      create: {
        id: "route-hn-qn",
        fromCity: "Hà Nội",
        toCity: "Quảng Ninh",
        distanceKm: 160,
        estimatedDuration: 180,
      },
    }),
    prisma.route.upsert({
      where: { id: "route-hn-v" },
      update: {},
      create: {
        id: "route-hn-v",
        fromCity: "Hà Nội",
        toCity: "Vinh",
        distanceKm: 300,
        estimatedDuration: 360,
      },
    }),
    prisma.route.upsert({
      where: { id: "route-hn-th" },
      update: {},
      create: {
        id: "route-hn-th",
        fromCity: "Hà Nội",
        toCity: "Thanh Hóa",
        distanceKm: 166,
        estimatedDuration: 190,
      },
    }),
    prisma.route.upsert({
      where: { id: "route-hn-nd" },
      update: {},
      create: {
        id: "route-hn-nd",
        fromCity: "Hà Nội",
        toCity: "Nam Định",
        distanceKm: 90,
        estimatedDuration: 120,
      },
    }),
  ]);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(6, 0, 0, 0);

  const trip1 = await prisma.trip.upsert({
    where: { id: "trip-hn-hp-1" },
    update: {},
    create: {
      id: "trip-hn-hp-1",
      routeId: routes[0].id,
      busId: busStandard.id,
      driverId: driver2.id,
      departureTime: tomorrow,
      arrivalTime: new Date(tomorrow.getTime() + 150 * 60000),
      price: 120000,
      status: "scheduled",
      pickupAddress: "Bến xe Mỹ Đình, Hà Nội",
      dropoffAddress: "Bến xe Hải Phòng, TP. Hải Phòng",
    },
  });
  console.log("✅ Trip 1:", trip1.id);

  const trip2 = await prisma.trip.upsert({
    where: { id: "trip-hn-qn-1" },
    update: {},
    create: {
      id: "trip-hn-qn-1",
      routeId: routes[1].id,
      busId: busSleeper.id,
      driverId: driver2.id,
      departureTime: tomorrow,
      arrivalTime: new Date(tomorrow.getTime() + 180 * 60000),
      price: 180000,
      status: "scheduled",
      pickupAddress: "Bến xe Gia Lâm, Hà Nội",
      dropoffAddress: "Bến xe Bãi Cháy, Quảng Ninh",
    },
  });
  console.log("✅ Trip 2:", trip2.id);

  const night = new Date();
  night.setDate(night.getDate() + 1);
  night.setHours(20, 0, 0, 0);

  const trip3 = await prisma.trip.upsert({
    where: { id: "trip-hn-v-1" },
    update: {},
    create: {
      id: "trip-hn-v-1",
      routeId: routes[2].id,
      busId: busSleeper.id,
      driverId: driver3.id,
      departureTime: night,
      arrivalTime: new Date(night.getTime() + 360 * 60000),
      price: 250000,
      status: "scheduled",
      pickupAddress: "Bến xe Giáp Bát, Hà Nội",
      dropoffAddress: "Bến xe Vinh, Nghệ An",
    },
  });
  console.log("✅ Trip 3:", trip3.id);

  const bcrypt = require("bcryptjs");

  const adminPassword = await bcrypt.hash("admin123456", 10);
  await prisma.user.upsert({
    where: { email: "admin@busgo.vn" },
    update: {},
    create: {
      email: "admin@busgo.vn",
      passwordHash: adminPassword,
      fullName: "Admin BusGo",
      phone: "0900000001",
      role: "admin",
      emailVerified: true,
    },
  });
  console.log("✅ Admin account created");
  await createStandardSeats(busStandard.id);
  await createTripSeats(trip1.id, busStandard.id);
  await createMinibusSeats(busMinibus.id);
  await createSleeperSeats(busSleeper.id);
  await createTripSeats(trip2.id, busSleeper.id);
  await createTripSeats(trip3.id, busSleeper.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
