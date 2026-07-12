const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const prisma = new PrismaClient();

// ─── Helpers ────────────────────────────────────────────────────────

function uuid() { return crypto.randomUUID(); }
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

function addMonths(date, n) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

function addDays(date, n) {
  return new Date(new Date(date).getTime() + n * 86400000);
}

async function hash(pw) {
  return bcrypt.hash(pw, 10);
}

async function generateSeats(busId, busType) {
  if (busType === "standard") {
    const cols = ["A", "B", "C", "D"];
    const data = [];
    for (let row = 1; row <= 6; row++)
      for (let i = 0; i < cols.length; i++)
        data.push({ busId, seatLabel: `${cols[i]}${row}`, rowNum: row, colNum: i + 1 });
    const lastRow = ["A", "B", "C", "D", "E"];
    for (let i = 0; i < lastRow.length; i++)
      data.push({ busId, seatLabel: `${lastRow[i]}7`, rowNum: 7, colNum: i + 1 });
    await prisma.seat.createMany({ data });
  } else if (busType === "sleeper") {
    const cols = ["A", "B", "C"];
    const data = [];
    for (let floor = 1; floor <= 2; floor++)
      for (let row = 1; row <= 6; row++)
        for (let i = 0; i < cols.length; i++)
          data.push({ busId, seatLabel: `${cols[i]}${row}-T${floor}`, rowNum: row, colNum: i + 1, floor, level: floor === 1 ? "lower" : "upper" });
    await prisma.seat.createMany({ data });
  } else if (busType === "minibus") {
    const positions = [
      { rowNum: 1, colNum: 2 }, { rowNum: 1, colNum: 3 },
      { rowNum: 2, colNum: 1 }, { rowNum: 2, colNum: 2 }, { rowNum: 2, colNum: 3 },
      { rowNum: 3, colNum: 1 }, { rowNum: 3, colNum: 2 }, { rowNum: 3, colNum: 3 },
      { rowNum: 4, colNum: 1 }, { rowNum: 4, colNum: 2 }, { rowNum: 4, colNum: 3 },
      { rowNum: 5, colNum: 1 }, { rowNum: 5, colNum: 2 }, { rowNum: 5, colNum: 3 }, { rowNum: 5, colNum: 4 },
    ];
    await prisma.seat.createMany({
      data: positions.map((s, i) => ({ busId, seatLabel: String(i + 1).padStart(2, "0"), ...s })),
    });
  }
}

// ─── Seed data ──────────────────────────────────────────────────────

const COMPANIES = [
  { name: "Phương Trang", hotline: "1900 6067", email: "info@phuongtrang.vn", address: "Bến xe Miền Tây, TP.HCM", description: "Hãng xe khách lớn nhất miền Nam" },
  { name: "Thành Bưởi", hotline: "028 3838 3838", email: "info@thanhbuoi.vn", address: "72 Trần Hưng Đạo, TP.HCM", description: "Chuyên tuyến HCM - Đà Lạt" },
  { name: "Hoàng Long", hotline: "1900 599 904", email: "info@hoanglong.vn", address: "Bến xe Giáp Bát, Hà Nội", description: "Hãng xe hàng đầu miền Bắc" },
];

const ROUTES = [
  { fromCity: "TP.HCM", toCity: "Hà Nội", distanceKm: 1726, estimatedDuration: 1080 },
  { fromCity: "TP.HCM", toCity: "Đà Nẵng", distanceKm: 964, estimatedDuration: 720 },
  { fromCity: "TP.HCM", toCity: "Đà Lạt", distanceKm: 310, estimatedDuration: 360 },
  { fromCity: "TP.HCM", toCity: "Vũng Tàu", distanceKm: 128, estimatedDuration: 150 },
  { fromCity: "TP.HCM", toCity: "Cần Thơ", distanceKm: 180, estimatedDuration: 180 },
  { fromCity: "TP.HCM", toCity: "Huế", distanceKm: 1050, estimatedDuration: 720 },
  { fromCity: "Hà Nội", toCity: "TP.HCM", distanceKm: 1726, estimatedDuration: 1080 },
  { fromCity: "Hà Nội", toCity: "Đà Nẵng", distanceKm: 763, estimatedDuration: 600 },
  { fromCity: "Hà Nội", toCity: "Hải Phòng", distanceKm: 105, estimatedDuration: 90 },
  { fromCity: "Hà Nội", toCity: "Quảng Ninh", distanceKm: 155, estimatedDuration: 150 },
  { fromCity: "Hà Nội", toCity: "Thanh Hóa", distanceKm: 150, estimatedDuration: 180 },
  { fromCity: "Hà Nội", toCity: "Nam Định", distanceKm: 90, estimatedDuration: 90 },
  { fromCity: "Hà Nội", toCity: "Vinh", distanceKm: 295, estimatedDuration: 300 },
  { fromCity: "Hà Nội", toCity: "Huế", distanceKm: 700, estimatedDuration: 540 },
];

const DRIVER_NAMES = [
  "Nguyễn Văn An", "Trần Văn Bình", "Lê Văn Cường", "Phạm Văn Dũng",
  "Hoàng Văn Em", "Vũ Văn Phú", "Đỗ Văn Giang", "Bùi Văn Hải",
  "Ngô Văn Hùng", "Đinh Văn Khoa", "Phan Văn Lâm", "Võ Văn Minh",
  "Trương Văn Nam", "Dương Văn Oai", "Lý Văn Phong", "Tô Văn Quân",
  "Mai Văn Rồng", "Cao Văn Sơn",
];

const USER_NAMES = [
  ["Nguyễn Thị Mai", "mai.nguyen"], ["Trần Văn Hùng", "hung.tran"],
  ["Lê Thị Lan", "lan.le"], ["Phạm Minh Tuấn", "tuan.pham"],
  ["Hoàng Thị Thu", "thu.hoang"], ["Vũ Đức Mạnh", "manh.vu"],
  ["Đỗ Thị Hoa", "hoa.do"], ["Bùi Văn Sơn", "son.bui"],
  ["Ngô Thị Linh", "linh.ngo"], ["Đinh Văn Tài", "tai.dinh"],
];

const PASSENGER_NAMES = [
  "Nguyễn Văn A", "Trần Thị B", "Lê Minh C", "Phạm Thị D", "Hoàng Văn E",
  "Vũ Thị F", "Đỗ Văn G", "Bùi Thị H", "Ngô Văn I", "Đinh Thị J",
  "Phan Văn K", "Võ Thị L", "Trương Văn M", "Dương Thị N", "Lý Văn O",
];

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Bắt đầu seed...");

  // 1. Admin account
  const adminPw = await hash("admin123");
  const admin = await prisma.user.upsert({
    where: { email: "admin@busgo.vn" },
    update: {},
    create: {
      email: "admin@busgo.vn", phone: "0900000000",
      fullName: "Super Admin", passwordHash: adminPw,
      role: "admin", emailVerified: true,
    },
  });
  console.log("✅ Admin:", admin.email);

  // 2. Routes
  const routes = [];
  for (const r of ROUTES) {
    const existing = await prisma.route.findFirst({ where: { fromCity: r.fromCity, toCity: r.toCity } });
    if (existing) { routes.push(existing); continue; }
    routes.push(await prisma.route.create({ data: r }));
  }
  console.log("✅ Routes:", routes.length);

  // 3. Companies + company admins + buses + drivers
  const companyData = [];

  for (let ci = 0; ci < COMPANIES.length; ci++) {
    const comp = COMPANIES[ci];

    let company = await prisma.company.findUnique({ where: { email: comp.email } });
    if (!company) company = await prisma.company.create({ data: comp });

    const caPw = await hash("company123");
    const caEmail = [, "admin@futa.vn", "admin@thanhbuoi.vn", "admin@hola.vn"][ci + 1];
    const caPhone = `090000000${ci + 1}`;
    await prisma.user.upsert({
      where: { email: caEmail },
      update: { companyId: company.id },
      create: {
        email: caEmail, phone: caPhone,
        fullName: `Quản lý ${comp.name}`, passwordHash: caPw,
        role: "company_admin", emailVerified: true, companyId: company.id,
      },
    }).catch(async () => {
      // phone conflict từ run cũ — update email
      await prisma.user.updateMany({
        where: { phone: caPhone },
        data: { email: caEmail, companyId: company.id, role: "company_admin" },
      });
    });

    const totalSeatsByType = { standard: 29, sleeper: 36, minibus: 15 };
    const busConfigs = [
      { licensePlate: `5${ci + 1}A-${10000 + ci * 100}`, busType: "sleeper", typeName: "Giường nằm VIP", layout: "2-1", amenities: { wifi: true, ac: true, usb: true, blanket: true } },
      { licensePlate: `5${ci + 1}B-${10100 + ci * 100}`, busType: "sleeper", typeName: "Giường nằm", layout: "2-1", amenities: { ac: true, usb: true } },
      { licensePlate: `5${ci + 1}C-${20000 + ci * 100}`, busType: "standard", typeName: "Ghế ngồi", layout: "2-2", amenities: { ac: true, usb: true } },
      { licensePlate: `5${ci + 1}D-${30000 + ci * 100}`, busType: "minibus", typeName: "Xe limousine", layout: "1-1", amenities: { wifi: true, ac: true, usb: true } },
    ];
    const buses = [];
    for (const bt of busConfigs) {
      let bus = await prisma.bus.findUnique({ where: { licensePlate: bt.licensePlate } });
      if (!bus) {
        bus = await prisma.bus.create({
          data: { ...bt, companyId: company.id, totalSeats: totalSeatsByType[bt.busType], isActive: true },
        });
        await generateSeats(bus.id, bt.busType);
      }
      buses.push(bus);
    }
    // buses[0,1] = sleeper, buses[2] = standard, buses[3] = minibus
    const sleeperBuses = buses.filter((b) => b.busType === "sleeper");
    const standardBuses = buses.filter((b) => b.busType === "standard");
    const minibusBuses = buses.filter((b) => b.busType === "minibus");

    const busForRoute = (route) => {
      if (route.distanceKm >= 500) return pick(sleeperBuses);
      if (route.distanceKm >= 150) return pick(standardBuses);
      return pick(minibusBuses);
    };

    const drivers = [];
    for (let di = 0; di < 4; di++) {
      const phone = `097${ci}00000${di}`;
      let driver = await prisma.driver.findFirst({ where: { phone } });
      if (!driver)
        driver = await prisma.driver.create({
          data: {
            fullName: DRIVER_NAMES[ci * 6 + di], phone,
            driverRole: "driver",
            licenseNo: `TX${ci}${di}${rand(100000, 999999)}`,
            licenseType: di < 2 ? "E" : "D",
            companyId: company.id,
            busId: buses[di % buses.length].id,
          },
        });
      drivers.push(driver);
    }

    const assistants = [];
    for (let ai = 0; ai < 2; ai++) {
      const phone = `098${ci}00000${ai}`;
      let assistant = await prisma.driver.findFirst({ where: { phone } });
      if (!assistant)
        assistant = await prisma.driver.create({
          data: {
            fullName: DRIVER_NAMES[ci * 6 + 4 + ai], phone,
            driverRole: "assistant", companyId: company.id,
            busId: sleeperBuses[ai % sleeperBuses.length].id,
          },
        });
      assistants.push(assistant);
    }

    companyData.push({ company, buses, drivers, assistants, busForRoute });
    console.log(`✅ Company ${ci + 1}: ${company.name}`);
  }

  // 4. Regular users
  const users = [];
  for (let i = 0; i < USER_NAMES.length; i++) {
    const [fullName, uname] = USER_NAMES[i];
    const email = `${uname}@gmail.com`;
    const phone = `091${String(i).padStart(7, "0")}`;
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user)
      user = await prisma.user.create({
        data: {
          email, phone, fullName,
          passwordHash: await hash("user123"),
          role: "user", emailVerified: true,
        },
      });
    users.push(user);
  }
  console.log("✅ Users:", users.length);

  // 5. Trips + Bookings (past 6 months → completed)
  const now = new Date();
  let totalBookings = 0;

  const PRICE_BY_TYPE = { sleeper: [350, 900], standard: [150, 400], minibus: [80, 250] };

  // Group trips theo routine (ci, routeId, hour) → cùng seriesId
  const seriesMap = new Map();
  function getSeriesId(ci, routeId, hour) {
    const key = `${ci}:${routeId}:${hour}`;
    if (!seriesMap.has(key)) seriesMap.set(key, uuid());
    return seriesMap.get(key);
  }

  for (let monthOffset = -5; monthOffset <= 0; monthOffset++) {
    for (let ci = 0; ci < companyData.length; ci++) {
      const { company, drivers, assistants, busForRoute } = companyData[ci];
      const companyRoutes = routes.slice(0, 8); // dùng 8 routes đầu cho past trips

      for (let ri = 0; ri < companyRoutes.length; ri++) {
        const route = companyRoutes[ri];
        const bus = busForRoute(route);
        const [pMin, pMax] = PRICE_BY_TYPE[bus.busType];

        for (let t = 0; t < 2; t++) {
          const baseDate = addMonths(now, monthOffset);
          baseDate.setDate(rand(1, 25));
          const hour = pick([6, 8, 12, 15, 18, 22]);
          baseDate.setHours(hour, 0, 0, 0);
          const dep = baseDate;
          const arr = new Date(dep.getTime() + route.estimatedDuration * 60000);
          const price = rand(pMin, pMax) * 1000;
          const driver = pick(drivers);
          const assistant = route.distanceKm >= 300 ? pick(assistants) : null;

          const trip = await prisma.trip.create({
            data: {
              routeId: route.id, busId: bus.id,
              driverId: driver.id, assistantId: assistant?.id ?? null,
              departureTime: dep, arrivalTime: arr, price,
              pickupAddress: `Bến xe ${route.fromCity}`,
              dropoffAddress: `Bến xe ${route.toCity}`,
              status: "completed",
              seriesId: getSeriesId(ci, route.id, hour),
            },
          });

          const seats = await prisma.seat.findMany({ where: { busId: bus.id } });
          await prisma.tripSeat.createMany({
            data: seats.map((s) => ({ tripId: trip.id, seatId: s.id, status: "available" })),
          });
          const tripSeats = await prisma.tripSeat.findMany({ where: { tripId: trip.id } });

          const maxSeats = bus.busType === "minibus" ? 10 : bus.busType === "standard" ? 20 : 25;
          const bookingCount = rand(Math.floor(maxSeats * 0.5), maxSeats);
          const selectedSeats = shuffle(tripSeats).slice(0, bookingCount);

          // Pre-generate UUIDs to enable batch inserts
          const bookingRows = selectedSeats.map((tripSeat) => {
            const bookingId = uuid();
            const bookingDate = new Date(dep.getTime() - rand(1, 10) * 86400000);
            return { bookingId, tripSeat, bookingDate, user: pick(users), passenger: pick(PASSENGER_NAMES) };
          });

          await prisma.booking.createMany({
            data: bookingRows.map(({ bookingId, bookingDate, user, passenger }) => ({
              id: bookingId, userId: user.id, tripId: trip.id, companyId: company.id,
              status: "paid", totalPrice: price,
              commissionAmount: Math.round(price * (company.commissionRate ?? 0.1)),
              passengerName: passenger,
              passengerPhone: `09${rand(10000000, 99999999)}`,
              passengerEmail: `passenger${rand(100, 999)}@gmail.com`,
              pickupAddress: `Bến xe ${route.fromCity}`,
              dropoffAddress: `Bến xe ${route.toCity}`,
              expiresAt: new Date(bookingDate.getTime() + 15 * 60000),
              createdAt: bookingDate,
            })),
          });

          await prisma.bookingSeat.createMany({
            data: bookingRows.map(({ bookingId, tripSeat }) => ({
              bookingId, seatId: tripSeat.id, tripId: trip.id,
            })),
          });

          await prisma.payment.createMany({
            data: bookingRows.map(({ bookingId, bookingDate }) => ({
              bookingId,
              vnpTxnRef: `TXN${uuid().replace(/-/g, "").slice(0, 16)}`,
              amount: price, status: "successful", paymentMethod: "vnpay",
              vnpResponseCode: "00",
              vnpBankCode: pick(["NCB", "VIETCOMBANK", "TECHCOMBANK", "MBBANK"]),
              vnpRaw: { code: "00" }, paidAt: bookingDate,
            })),
          });

          await prisma.ticket.createMany({
            data: bookingRows.map(({ bookingId }) => ({
              bookingId,
              ticketCode: uuid().replace(/-/g, "").slice(0, 12).toUpperCase(),
              qrCode: `QR${uuid()}`,
              isUsed: true, usedAt: dep,
            })),
          });

          await prisma.$transaction(
            bookingRows.map(({ tripSeat, bookingId }) =>
              prisma.tripSeat.update({ where: { id: tripSeat.id }, data: { status: "booked", bookingId } })
            )
          );

          totalBookings += bookingCount;
        }
      }
    }
  }
  console.log("✅ Bookings (paid):", totalBookings);

  // 6. Future trips (scheduled) — mỗi ngày trong 30 ngày tới
  const routeByCity = (from, to) => routes.find((r) => r.fromCity === from && r.toCity === to);

  // Tuyến chính theo nhà xe
  const SCHEDULE = [
    {
      ci: 0, // Phương Trang — miền Bắc
      daily: [
        { route: routeByCity("Hà Nội", "Hải Phòng"), hours: [6, 10, 15], price: 120000 },
        { route: routeByCity("Hà Nội", "Quảng Ninh"), hours: [7, 13], price: 180000 },
        { route: routeByCity("Hà Nội", "Thanh Hóa"), hours: [8, 14], price: 150000 },
        { route: routeByCity("Hà Nội", "Nam Định"), hours: [9, 16], price: 100000 },
        { route: routeByCity("Hà Nội", "Vinh"), hours: [7], price: 250000 },
      ],
      occasional: [
        { route: routeByCity("Hà Nội", "Đà Nẵng"), hours: [18], price: 450000, everyNDays: 2 },
        { route: routeByCity("Hà Nội", "TP.HCM"), hours: [19], price: 800000, everyNDays: 3 },
      ],
    },
    {
      ci: 1, // Thành Bưởi — miền Nam
      daily: [
        { route: routeByCity("TP.HCM", "Đà Lạt"), hours: [6, 12, 20], price: 200000 },
        { route: routeByCity("TP.HCM", "Vũng Tàu"), hours: [7, 11, 15], price: 120000 },
        { route: routeByCity("TP.HCM", "Cần Thơ"), hours: [8, 14], price: 150000 },
      ],
      occasional: [
        { route: routeByCity("TP.HCM", "Đà Nẵng"), hours: [19], price: 400000, everyNDays: 2 },
        { route: routeByCity("TP.HCM", "Huế"), hours: [18], price: 500000, everyNDays: 3 },
      ],
    },
    {
      ci: 2, // Hoàng Long — miền Nam
      daily: [
        { route: routeByCity("TP.HCM", "Đà Lạt"), hours: [7, 13, 21], price: 210000 },
        { route: routeByCity("TP.HCM", "Cần Thơ"), hours: [9, 16], price: 155000 },
        { route: routeByCity("TP.HCM", "Hà Nội"), hours: [18], price: 780000 },
      ],
      occasional: [
        { route: routeByCity("TP.HCM", "Đà Nẵng"), hours: [20], price: 420000, everyNDays: 2 },
        { route: routeByCity("TP.HCM", "Huế"), hours: [19], price: 480000, everyNDays: 3 },
      ],
    },
  ];

  let futureTripCount = 0;

  async function createScheduledTrip(route, dep, price, seriesId, { drivers, assistants, busForRoute }) {
    if (!route) return;
    const bus = busForRoute(route);
    const driver = pick(drivers);
    const assistantId = route.distanceKm >= 300 ? pick(assistants).id : null;
    const arr = new Date(dep.getTime() + route.estimatedDuration * 60000);
    const trip = await prisma.trip.create({
      data: {
        routeId: route.id, busId: bus.id,
        driverId: driver.id, assistantId,
        departureTime: dep, arrivalTime: arr, price,
        pickupAddress: `Bến xe ${route.fromCity}`,
        dropoffAddress: `Bến xe ${route.toCity}`,
        status: "scheduled",
        seriesId,
      },
    });
    const seats = await prisma.seat.findMany({ where: { busId: bus.id } });
    await prisma.tripSeat.createMany({
      data: seats.map((s) => ({ tripId: trip.id, seatId: s.id, status: "available" })),
    });
    futureTripCount++;
  }

  for (const { ci, daily, occasional } of SCHEDULE) {
    const cd = companyData[ci];

    for (let d = 1; d <= 30; d++) {
      for (const { route, hours, price } of daily) {
        for (const hour of hours) {
          const dep = addDays(now, d);
          dep.setHours(hour, 0, 0, 0);
          const seriesId = getSeriesId(ci, route.id, hour);
          await createScheduledTrip(route, dep, price, seriesId, cd);
        }
      }
      for (const { route, hours, price, everyNDays } of occasional) {
        if (d % everyNDays === 0) {
          const dep = addDays(now, d);
          dep.setHours(hours[0], 0, 0, 0);
          const seriesId = getSeriesId(ci, route.id, hours[0]);
          await createScheduledTrip(route, dep, price, seriesId, cd);
        }
      }
    }
    console.log(`  ✅ Scheduled trips: Company ${ci + 1} done`);
  }
  console.log("✅ Future trips:", futureTripCount);

  // 7. Reports
  const paidBookings = await prisma.booking.findMany({
    where: { status: "paid" }, take: 6,
    include: { trip: true },
  });
  const CATEGORIES = ["dangerous_driving", "late_departure", "rude_behavior", "dirty_vehicle", "wrong_stop", "phone_while_driving"];
  for (let i = 0; i < paidBookings.length; i++) {
    const b = paidBookings[i];
    await prisma.report.create({
      data: {
        userId: b.userId, driverId: b.trip.driverId, bookingId: b.id,
        category: CATEGORIES[i],
        details: "Khiếu nại từ khách hàng trong quá trình sử dụng dịch vụ.",
        severity: pick(["low", "medium", "high"]),
        status: pick(["pending", "reviewing", "resolved"]),
      },
    });
  }
  console.log("✅ Reports: 6");

  console.log("\n🎉 Seed hoàn tất!");
  console.log("─────────────────────────────────────────────────");
  console.log("  Admin:         admin@busgo.vn        / admin123");
  console.log("  Company admin: admin@futa.vn          / company123  (Phương Trang)");
  console.log("                 admin@thanhbuoi.vn    / company123  (Thành Bưởi)");
  console.log("                 admin@hola.vn         / company123  (Hoàng Long)");
  console.log("  User:          mai.nguyen@gmail.com  / user123");
  console.log("─────────────────────────────────────────────────");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
