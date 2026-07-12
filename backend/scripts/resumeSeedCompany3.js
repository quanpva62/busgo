// Resume script — chỉ hoàn thành phần còn dở của seed.js:
//   1. Future trips (scheduled) cho Company 3 (Hoàng Long)
//   2. Reports mẫu
// Không đụng tới Admin/Routes/Company/User/Bookings đã seed xong trước đó.
const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();

function uuid() { return crypto.randomUUID(); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function addDays(date, n) { return new Date(new Date(date).getTime() + n * 86400000); }

async function main() {
  console.log("🔧 Resume seed: Company 3 (Hoàng Long) + Reports\n");

  const company = await prisma.company.findUnique({ where: { email: "info@hoanglong.vn" } });
  if (!company) throw new Error("Không tìm thấy Company Hoàng Long — chạy seed.js gốc trước");

  const routes = await prisma.route.findMany();
  const routeByCity = (from, to) => routes.find((r) => r.fromCity === from && r.toCity === to);

  const buses = await prisma.bus.findMany({ where: { companyId: company.id } });
  const sleeperBuses = buses.filter((b) => b.busType === "sleeper");
  const standardBuses = buses.filter((b) => b.busType === "standard");
  const minibusBuses = buses.filter((b) => b.busType === "minibus");
  const busForRoute = (route) => {
    if (route.distanceKm >= 500) return pick(sleeperBuses);
    if (route.distanceKm >= 150) return pick(standardBuses);
    return pick(minibusBuses);
  };

  const drivers = await prisma.driver.findMany({ where: { companyId: company.id, driverRole: "driver" } });
  const assistants = await prisma.driver.findMany({ where: { companyId: company.id, driverRole: "assistant" } });
  if (drivers.length === 0 || buses.length === 0) {
    throw new Error("Company 3 chưa có buses/drivers — chạy seed.js gốc trước (bước 1-4 chưa hoàn tất)");
  }

  // Dọn trip bị tạo dở (không có TripSeat) do process bị treo/ngắt kết nối trước đó
  const busIds = buses.map((b) => b.id);
  const brokenTrips = await prisma.trip.findMany({
    where: { busId: { in: busIds }, status: "scheduled", tripSeats: { none: {} } },
    select: { id: true },
  });
  if (brokenTrips.length > 0) {
    await prisma.trip.deleteMany({ where: { id: { in: brokenTrips.map((t) => t.id) } } });
    console.log(`🧹 Đã xoá ${brokenTrips.length} trip tạo dở (thiếu TripSeat)`);
  }

  const now = new Date();
  const seriesMap = new Map();
  function getSeriesId(routeId, hour) {
    const key = `${routeId}:${hour}`;
    if (!seriesMap.has(key)) seriesMap.set(key, uuid());
    return seriesMap.get(key);
  }

  const SCHEDULE = {
    daily: [
      { route: routeByCity("TP.HCM", "Đà Lạt"), hours: [7, 13, 21], price: 210000 },
      { route: routeByCity("TP.HCM", "Cần Thơ"), hours: [9, 16], price: 155000 },
      { route: routeByCity("TP.HCM", "Hà Nội"), hours: [18], price: 780000 },
    ],
    occasional: [
      { route: routeByCity("TP.HCM", "Đà Nẵng"), hours: [20], price: 420000, everyNDays: 2 },
      { route: routeByCity("TP.HCM", "Huế"), hours: [19], price: 480000, everyNDays: 3 },
    ],
  };

  let created = 0;
  let skipped = 0;

  async function createIfMissing(route, dep, price, seriesId) {
    if (!route) return;
    const existing = await prisma.trip.findFirst({
      where: { routeId: route.id, departureTime: dep, busId: { in: busIds } },
      select: { id: true },
    });
    if (existing) { skipped++; return; }

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
    created++;
  }

  for (let d = 1; d <= 30; d++) {
    for (const { route, hours, price } of SCHEDULE.daily) {
      for (const hour of hours) {
        const dep = addDays(now, d);
        dep.setHours(hour, 0, 0, 0);
        await createIfMissing(route, dep, price, getSeriesId(route.id, hour));
      }
    }
    for (const { route, hours, price, everyNDays } of SCHEDULE.occasional) {
      if (d % everyNDays === 0) {
        const dep = addDays(now, d);
        dep.setHours(hours[0], 0, 0, 0);
        await createIfMissing(route, dep, price, getSeriesId(route.id, hours[0]));
      }
    }
  }
  console.log(`✅ Future trips Company 3: ${created} tạo mới, ${skipped} đã tồn tại (bỏ qua)`);

  // Reports mẫu — chỉ tạo nếu chưa có
  const reportCount = await prisma.report.count();
  if (reportCount > 0) {
    console.log(`✅ Reports: đã có ${reportCount}, bỏ qua`);
  } else {
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
    console.log(`✅ Reports: ${paidBookings.length}`);
  }

  console.log("\n🎉 Resume hoàn tất!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
