const prisma = require("../lib/prisma");
const { Prisma } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const supabase = require("../lib/supabase");
const { notify, notifyMany } = require("../lib/notify");
const { refundVnpay } = require("./payment.controller");

const getCompanyFilter = async (req) => {
  if (req.user.role !== "company_admin") return Prisma.empty;

  const u = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { companyId: true },
  });

  if (!u || !u.companyId) return Prisma.empty;

  return Prisma.sql`AND bus."companyId" = ${u.companyId}`;
};

const getUsers = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count(),
    ]);

    res.json({ users, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

const toggleUserStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: "Không tìm thấy người dùng" });
    }
    if (user.role === "admin") {
      return res
        .status(403)
        .json({ error: "Không thể đổi trạng thái tài khoản admin" });
    }
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
    });
    res.json({
      message: `Đã ${updatedUser.isActive ? "kích hoạt" : "vô hiệu hoá"} tài khoản`,
    });
  } catch (error) {
    next(error);
  }
};

const getCompanyTrips = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });
    if (!user) {
      return res.status(404).json({ error: "Không tìm thấy người dùng" });
    }

    const { companyId } = user;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 15;
    const skip = (page - 1) * limit;
    const where = { bus: { companyId } };

    const [trips, total] = await Promise.all([
      prisma.trip.findMany({
        where,
        include: {
          bus: true,
          driver: true,
          assistant: true,
          route: true,
        },
        orderBy: { departureTime: "desc" },
        skip,
        take: limit,
      }),
      prisma.trip.count({ where }),
    ]);

    res.json({ trips, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

const getCompanyBookings = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });
    if (!user) {
      return res.status(404).json({ error: "Không tìm thấy người dùng" });
    }
    const { companyId } = user;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 15;
    const skip = (page - 1) * limit;
    const where = { trip: { bus: { companyId } } };

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          trip: {
            include: {
              bus: true,
              driver: true,
              assistant: true,
              route: true,
            },
          },
          user: { select: { id: true, fullName: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ]);

    res.json({ bookings, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

const getCompanyStats = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });
    if (!user) {
      return res.status(404).json({ error: "Không tìm thấy người dùng" });
    }
    const { companyId } = user;

    const totalTrips = await prisma.trip.count({
      where: { bus: { companyId } },
    });
    const totalBookings = await prisma.booking.count({
      where: { trip: { bus: { companyId } } },
    });
    const totalRevenue = await prisma.booking.aggregate({
      where: { trip: { bus: { companyId } }, status: "paid" },
      _sum: { totalPrice: true, commissionAmount: true },
    });
    const gross = totalRevenue._sum.totalPrice ?? 0;
    const commission = totalRevenue._sum.commissionAmount ?? 0;
    res.json({
      totalTrips,
      totalBookings,
      totalRevenue: gross,
      totalCommission: commission,
      netRevenue: gross - commission,
    });
  } catch (error) {
    next(error);
  }
};

const getAdminStats = async (req, res, next) => {
  try {
    const [totalUsers, totalBookings, revenue, pendingReports] =
      await Promise.all([
        prisma.user.count({ where: { role: "user" } }),
        prisma.booking.count({ where: { status: "paid" } }),
        prisma.booking.aggregate({
          where: { status: "paid" },
          _sum: { totalPrice: true, commissionAmount: true },
        }),
        prisma.report.count({ where: { status: "pending" } }),
      ]);
    res.json({
      totalUsers,
      totalBookings,
      totalRevenue: revenue._sum.totalPrice ?? 0,
      totalCommission: revenue._sum.commissionAmount ?? 0,
      pendingReports,
    });
  } catch (error) {
    next(error);
  }
};

const getCompanyReports = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });
    const reports = await prisma.report.findMany({
      where: { driver: { companyId: user.companyId } },
      include: {
        user: { select: { id: true, fullName: true } },
        driver: { select: { id: true, fullName: true } },
        booking: { include: { trip: { include: { route: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ reports });
  } catch (error) {
    next(error);
  }
};

const updateTripStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });
    const trip = await prisma.trip.findUnique({
      where: { id },
      include: { bus: true, route: true },
    });
    if (!trip) return res.status(404).json({ error: "Trip không tồn tại" });
    if (
      req.user.role === "company_admin" &&
      trip.bus.companyId !== user.companyId
    ) {
      return res
        .status(403)
        .json({ error: "Bạn không có quyền cập nhật chuyến này" });
    }
    const updated = await prisma.trip.update({
      where: { id },
      data: { status },
    });

    // Chuyến bị huỷ → hoàn tiền 100% + trả ghế + thông báo tất cả khách
    if (status === "cancelled" && trip.status !== "cancelled") {
      const bookings = await prisma.booking.findMany({
        where: { tripId: id, status: { in: ["pending", "paid"] } },
        include: { payment: true },
      });

      const refundFailures = [];

      for (const b of bookings) {
        // paid → hoàn 100% (operator huỷ, không áp policy thời gian)
        let refundRes = null;
        if (b.status === "paid" && b.payment?.status === "successful") {
          refundRes = await refundVnpay({
            payment: b.payment,
            refundAmount: b.totalPrice,
            ipAddr: req.ip || "127.0.0.1",
            createBy: req.user.userId,
          });
          if (!refundRes.success) {
            refundFailures.push(b.id);
            continue; // refund fail → KHÔNG đổi DB, để xử lý tay
          }
        }

        const newStatus = refundRes ? "refunded" : "cancelled";
        await prisma.$transaction(async (tx) => {
          await tx.booking.update({
            where: { id: b.id },
            data: { status: newStatus, commissionAmount: 0 },
          });
          await tx.tripSeat.updateMany({
            where: { bookingId: b.id },
            data: { status: "available", bookingId: null, heldUntil: null },
          });
          if (refundRes) {
            await tx.payment.update({
              where: { id: b.payment.id },
              data: {
                status: "refunded",
                vnpRaw: { ...b.payment.vnpRaw, refund: refundRes.raw },
              },
            });
          }
        });
      }

      const userIds = [...new Set(bookings.map((b) => b.userId))];
      await notifyMany(
        userIds,
        "trip",
        "Chuyến đi bị huỷ",
        `Chuyến ${trip.route.fromCity} → ${trip.route.toCity} đã bị huỷ. Vé đã thanh toán được hoàn tiền 100% tự động.`,
      );

      if (refundFailures.length > 0) {
        return res.json({
          message: `Đã huỷ chuyến. ${refundFailures.length}/${bookings.length} vé hoàn tiền thất bại — cần xử lý thủ công.`,
          trip: updated,
          refundFailures,
        });
      }
    }

    res.json({ message: "Đã cập nhật trạng thái", trip: updated });
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const { email, password, fullName, phone, role, companyId } = req.body;
    if (!["admin", "company_admin", "staff"].includes(role)) {
      return res.status(400).json({ error: "Role không hợp lệ" });
    }
    if (role === "company_admin" && !companyId) {
      return res
        .status(400)
        .json({ error: "Cần chọn doanh nghiệp cho company_admin" });
    }

    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail)
      return res.status(400).json({ error: "Email đã tồn tại" });
    const existingPhone = await prisma.user.findUnique({ where: { phone } });
    if (existingPhone) return res.status(400).json({ error: "SĐT đã tồn tại" });

    if (companyId) {
      const company = await prisma.company.findUnique({
        where: { id: companyId },
      });
      if (!company)
        return res.status(400).json({ error: "Doanh nghiệp không tồn tại" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        phone,
        role,
        companyId: role === "company_admin" ? companyId : null,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        companyId: true,
      },
    });
    res.status(201).json({ message: "Tạo tài khoản thành công", user });
  } catch (error) {
    next(error);
  }
};

const getCompanies = async (req, res, next) => {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { buses: true, drivers: true, users: true } },
      },
    });
    res.json(companies);
  } catch (error) {
    next(error);
  }
};

const createCompany = async (req, res, next) => {
  try {
    const { name, hotline, email, address, description } = req.body;
    const existing = await prisma.company.findUnique({ where: { email } });
    if (existing)
      return res.status(400).json({ error: "Email doanh nghiệp đã tồn tại" });

    const company = await prisma.company.create({
      data: { name, hotline, email, address, description },
    });
    res.status(201).json({ message: "Tạo doanh nghiệp thành công", company });
  } catch (error) {
    next(error);
  }
};

// ─── Helpers ────────────────────────────────────────────────────────

async function getCompanyId(req, res, next) {
  const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
  if (!user?.companyId) {
    return next(new Error("Tài khoản không thuộc doanh nghiệp nào"));
    return null;
  }
  return user.companyId;
}

async function generateSeatsForBus(busId, busType) {
  if (busType === "standard") {
    const cols = ["A", "B", "C", "D"];
    const data = [];
    for (let row = 1; row <= 6; row++) {
      for (let i = 0; i < cols.length; i++) {
        data.push({
          busId,
          seatLabel: `${cols[i]}${row}`,
          rowNum: row,
          colNum: i + 1,
        });
      }
    }
    const lastRow = ["A", "B", "C", "D", "E"];
    for (let i = 0; i < lastRow.length; i++) {
      data.push({
        busId,
        seatLabel: `${lastRow[i]}7`,
        rowNum: 7,
        colNum: i + 1,
      });
    }
    await prisma.seat.createMany({ data });
    return data.length;
  }
  if (busType === "minibus") {
    const data = [
      { rowNum: 1, colNum: 2 },
      { rowNum: 1, colNum: 3 },
      { rowNum: 2, colNum: 1 },
      { rowNum: 2, colNum: 2 },
      { rowNum: 2, colNum: 3 },
      { rowNum: 3, colNum: 1 },
      { rowNum: 3, colNum: 2 },
      { rowNum: 3, colNum: 3 },
      { rowNum: 4, colNum: 1 },
      { rowNum: 4, colNum: 2 },
      { rowNum: 4, colNum: 3 },
      { rowNum: 5, colNum: 1 },
      { rowNum: 5, colNum: 2 },
      { rowNum: 5, colNum: 3 },
      { rowNum: 5, colNum: 4 },
    ].map((s, i) => ({
      busId,
      seatLabel: String(i + 1).padStart(2, "0"),
      ...s,
    }));
    await prisma.seat.createMany({ data });
    return data.length;
  }
  if (busType === "sleeper") {
    const cols = ["A", "B", "C"];
    const data = [];
    for (let floor = 1; floor <= 2; floor++) {
      for (let row = 1; row <= 6; row++) {
        for (let i = 0; i < cols.length; i++) {
          data.push({
            busId,
            seatLabel: `${cols[i]}${row}-T${floor}`,
            rowNum: row,
            colNum: i + 1,
            floor,
            level: floor === 1 ? "lower" : "upper",
          });
        }
      }
    }
    await prisma.seat.createMany({ data });
    return data.length;
  }
  return 0;
}

// ─── Driver / Assistant CRUD ────────────────────────────────────────

const getCompanyDrivers = async (req, res, next) => {
  try {
    const companyId = await getCompanyId(req, res, next);
    if (!companyId) return;
    const where = { companyId };
    if (req.query.role === "driver" || req.query.role === "assistant") {
      where.driverRole = req.query.role;
    }
    const drivers = await prisma.driver.findMany({
      where,
      include: {
        bus: { select: { id: true, licensePlate: true, typeName: true } },
      },
      orderBy: { joinDate: "desc" },
    });
    res.json(drivers);
  } catch (error) {
    next(error);
  }
};

const createCompanyDriver = async (req, res, next) => {
  try {
    const companyId = await getCompanyId(req, res, next);
    if (!companyId) return;
    const { fullName, phone, driverRole, licenseNo, licenseType } = req.body;
    if (!["driver", "assistant"].includes(driverRole)) {
      return res.status(400).json({ error: "Vai trò không hợp lệ" });
    }
    const driver = await prisma.driver.create({
      data: {
        companyId,
        fullName,
        phone,
        driverRole,
        licenseNo,
        licenseType,
      },
    });
    res.status(201).json({ driver });
  } catch (error) {
    console.error(error);
    if (error.code === "P2002")
      return res.status(400).json({ error: "SĐT hoặc số bằng đã tồn tại" });
    next(error);
  }
};

const updateCompanyDriver = async (req, res, next) => {
  try {
    const companyId = await getCompanyId(req, res, next);
    if (!companyId) return;
    const { id } = req.params;
    const driver = await prisma.driver.findUnique({ where: { id } });
    if (!driver || driver.companyId !== companyId) {
      return res.status(404).json({ error: "Tài xế không tồn tại" });
    }
    const { fullName, phone, licenseNo, licenseType, isActive } = req.body;
    const updated = await prisma.driver.update({
      where: { id },
      data: { fullName, phone, licenseNo, licenseType, isActive },
    });
    res.json({ driver: updated });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const deleteCompanyDriver = async (req, res, next) => {
  try {
    const companyId = await getCompanyId(req, res, next);
    if (!companyId) return;
    const { id } = req.params;
    const driver = await prisma.driver.findUnique({ where: { id } });
    if (!driver || driver.companyId !== companyId) {
      return res.status(404).json({ error: "Tài xế không tồn tại" });
    }
    await prisma.driver.update({ where: { id }, data: { isActive: false } });
    res.json({ message: "Đã ngưng hoạt động tài xế" });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// ─── Bus CRUD ───────────────────────────────────────────────────────

const getCompanyBuses = async (req, res, next) => {
  try {
    const companyId = await getCompanyId(req, res, next);
    if (!companyId) return;
    const buses = await prisma.bus.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { trips: true, drivers: true } } },
    });
    res.json(buses);
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const createCompanyBus = async (req, res, next) => {
  try {
    const companyId = await getCompanyId(req, res, next);
    if (!companyId) return;
    const { licensePlate, busType, typeName, layout, amenities } = req.body;
    if (!["standard", "sleeper", "minibus"].includes(busType)) {
      return res.status(400).json({ error: "Loại xe không hợp lệ" });
    }
    const totalSeatsByType = { standard: 29, sleeper: 36, minibus: 16 };
    const bus = await prisma.bus.create({
      data: {
        companyId,
        licensePlate,
        busType,
        typeName,
        totalSeats: totalSeatsByType[busType],
        layout: layout ?? (busType === "sleeper" ? "2-1" : "2-2"),
        amenities: amenities ?? {},
      },
    });
    await generateSeatsForBus(bus.id, busType);
    res.status(201).json({ bus });
  } catch (error) {
    console.error(error);
    if (error.code === "P2002")
      return res.status(400).json({ error: "Biển số đã tồn tại" });
    next(error);
  }
};

const updateCompanyBus = async (req, res, next) => {
  try {
    const companyId = await getCompanyId(req, res, next);
    if (!companyId) return;
    const { id } = req.params;
    const bus = await prisma.bus.findUnique({ where: { id } });
    if (!bus || bus.companyId !== companyId)
      return res.status(404).json({ error: "Xe không tồn tại" });
    const { licensePlate, typeName, layout, amenities, isActive } = req.body;
    const updated = await prisma.bus.update({
      where: { id },
      data: { licensePlate, typeName, layout, amenities, isActive },
    });
    res.json({ bus: updated });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const deleteCompanyBus = async (req, res, next) => {
  try {
    const companyId = await getCompanyId(req, res, next);
    if (!companyId) return;
    const { id } = req.params;
    const bus = await prisma.bus.findUnique({ where: { id } });
    if (!bus || bus.companyId !== companyId)
      return res.status(404).json({ error: "Xe không tồn tại" });
    await prisma.bus.update({ where: { id }, data: { isActive: false } });
    res.json({ message: "Đã ngưng hoạt động xe" });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// ─── Trip create / delete ───────────────────────────────────────────

const INTERVAL_MS = { daily: 86400000, weekly: 604800000, monthly: null };

async function createSingleTrip(
  tx,
  {
    routeId,
    busId,
    driverId,
    assistantId,
    dep,
    route,
    price,
    pickupAddress,
    dropoffAddress,
    seriesId,
    interval,
  },
) {
  const arr = new Date(dep.getTime() + route.estimatedDuration * 60000);
  const t = await tx.trip.create({
    data: {
      routeId,
      busId,
      driverId,
      assistantId: assistantId || null,
      departureTime: dep,
      arrivalTime: arr,
      price: parseInt(price),
      pickupAddress,
      dropoffAddress,
      seriesId: seriesId || null,
      interval: interval || null,
    },
  });
  const seats = await tx.seat.findMany({ where: { busId } });
  if (seats.length === 0)
    throw new Error("Xe chưa có ghế. Vui lòng tạo lại xe.");
  await tx.tripSeat.createMany({
    data: seats.map((s) => ({
      tripId: t.id,
      seatId: s.id,
      status: "available",
    })),
  });
  return t;
}

const createCompanyTrip = async (req, res, next) => {
  try {
    const companyId = await getCompanyId(req, res, next);
    if (!companyId) return;
    const {
      routeId,
      busId,
      driverId,
      assistantId,
      departureTime,
      price,
      pickupAddress,
      dropoffAddress,
      interval,
      occurrences,
    } = req.body;

    const [bus, driver, route] = await Promise.all([
      prisma.bus.findUnique({ where: { id: busId } }),
      prisma.driver.findUnique({ where: { id: driverId } }),
      prisma.route.findUnique({ where: { id: routeId } }),
    ]);
    if (!bus || bus.companyId !== companyId)
      return res.status(400).json({ error: "Xe không hợp lệ" });
    if (!driver || driver.companyId !== companyId)
      return res.status(400).json({ error: "Tài xế không hợp lệ" });
    if (!route) return res.status(400).json({ error: "Tuyến không tồn tại" });
    if (assistantId) {
      const assistant = await prisma.driver.findUnique({
        where: { id: assistantId },
      });
      if (!assistant || assistant.companyId !== companyId)
        return res.status(400).json({ error: "Phụ xe không hợp lệ" });
    }

    const isRecurring = interval && occurrences > 1;
    const seriesId = isRecurring ? require("crypto").randomUUID() : null;
    const count = isRecurring ? Math.min(parseInt(occurrences), 52) : 1;
    const base = new Date(departureTime);

    const trips = [];
    for (let i = 0; i < count; i++) {
      let dep = new Date(base);
      if (i > 0) {
        if (interval === "daily") dep = new Date(base.getTime() + i * 86400000);
        else if (interval === "weekly")
          dep = new Date(base.getTime() + i * 7 * 86400000);
        else if (interval === "monthly") {
          dep = new Date(base);
          dep.setMonth(dep.getMonth() + i);
        }
      }
      const t = await prisma.$transaction(async (tx) =>
        createSingleTrip(tx, {
          routeId,
          busId,
          driverId,
          assistantId,
          dep,
          route,
          price,
          pickupAddress,
          dropoffAddress,
          seriesId,
          interval: isRecurring ? interval : null,
        }),
      );
      trips.push(t);
    }

    const firstTrip = await prisma.trip.findUnique({
      where: { id: trips[0].id },
      include: { bus: true, driver: true, assistant: true, route: true },
    });
    res.status(201).json({ trip: firstTrip, total: trips.length, seriesId });
  } catch (error) {
    next(error);
  }
};

const deleteCompanyTripSeries = async (req, res, next) => {
  try {
    const companyId = await getCompanyId(req, res, next);
    if (!companyId) return;
    const { seriesId } = req.params;
    const trips = await prisma.trip.findMany({
      where: { seriesId },
      include: { bus: true, _count: { select: { bookings: true } } },
    });
    if (trips.length === 0)
      return res.status(404).json({ error: "Không tìm thấy chuỗi chuyến" });
    if (trips.some((t) => t.bus.companyId !== companyId))
      return res.status(403).json({ error: "Không có quyền" });
    const hasBooking = trips.some((t) => t._count.bookings > 0);
    if (hasBooking)
      return res.status(400).json({
        error:
          "Một số chuyến đã có booking. Hãy đổi trạng thái sang 'Đã huỷ' thay vì xoá.",
      });
    const tripIds = trips.map((t) => t.id);
    await prisma.$transaction([
      prisma.tripSeat.deleteMany({ where: { tripId: { in: tripIds } } }),
      prisma.trip.deleteMany({ where: { id: { in: tripIds } } }),
    ]);
    res.json({ message: `Đã xoá ${tripIds.length} chuyến trong chuỗi` });
  } catch (error) {
    next(error);
  }
};

const deleteCompanyTrip = async (req, res, next) => {
  try {
    const companyId = await getCompanyId(req, res, next);
    if (!companyId) return;
    const { id } = req.params;
    const trip = await prisma.trip.findUnique({
      where: { id },
      include: { bus: true, _count: { select: { bookings: true } } },
    });
    if (!trip || trip.bus.companyId !== companyId)
      return res.status(404).json({ error: "Chuyến không tồn tại" });
    if (trip._count.bookings > 0) {
      return res.status(400).json({
        error:
          "Chuyến đã có booking, không thể xoá. Hãy đổi sang trạng thái 'Đã huỷ'.",
      });
    }
    await prisma.$transaction([
      prisma.tripSeat.deleteMany({ where: { tripId: id } }),
      prisma.trip.delete({ where: { id } }),
    ]);
    res.json({ message: "Đã xoá chuyến" });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// ─── Routes (global) ────────────────────────────────────────────────

const getRoutes = async (req, res, next) => {
  try {
    const routes = await prisma.route.findMany({
      orderBy: { fromCity: "asc" },
    });
    res.json(routes);
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const createRoute = async (req, res, next) => {
  try {
    const { fromCity, toCity, distanceKm, estimatedDuration } = req.body;
    if (!fromCity || !toCity || !distanceKm || !estimatedDuration)
      return res.status(400).json({ error: "Thiếu thông tin tuyến đường" });
    const route = await prisma.route.create({
      data: {
        fromCity: fromCity.trim(),
        toCity: toCity.trim(),
        distanceKm: parseInt(distanceKm),
        estimatedDuration: parseInt(estimatedDuration),
      },
    });
    res.status(201).json(route);
  } catch (error) {
    next(error);
  }
};

const updateCompany = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, hotline, email, address, description, isActive, commissionRate } =
      req.body;
    const company = await prisma.company.update({
      where: { id },
      data: {
        name,
        hotline,
        email,
        address,
        description,
        isActive,
        commissionRate:
          commissionRate !== undefined ? Number(commissionRate) : undefined,
      },
    });
    res.json({ message: "Cập nhật thành công", company });
  } catch (error) {
    next(error);
  }
};

// ─── Chart ────────────────────────────────────────────────

const totalRevenueChart = async (req, res, next) => {
  try {
    const groupBy = req.query.groupBy === "year" ? "year" : "month";
    const year = req.query.year
      ? parseInt(req.query.year)
      : new Date().getFullYear();
    const companyFilter = await getCompanyFilter(req);

    let result;
    if (groupBy === "month") {
      result = await prisma.$queryRaw`
        SELECT DATE_TRUNC('month', "createdAt") as period,
               SUM("totalPrice") as revenue
        FROM "Booking" b
        JOIN "Trip" t On t.id = b."tripId"
        JOIN "Bus" bus ON bus.id = t."busId"
        WHERE b.status = 'paid'
          AND EXTRACT(year FROM b."createdAt") = ${year}
          ${companyFilter}
        GROUP BY period
        ORDER BY period ASC
      `;
    } else {
      result = await prisma.$queryRaw`
        SELECT DATE_TRUNC('year', b."createdAt") as period,
               SUM(b."totalPrice") as revenue
        FROM "Booking" b
        JOIN "Trip" t On t.id = b."tripId"
        JOIN "Bus" bus ON bus.id = t."busId"
        WHERE b.status = 'paid'
          ${companyFilter}
        GROUP BY period
        ORDER BY period ASC
        LIMIT 5
      `;
    }

    const data = result.map((r) => ({
      period: r.period,
      revenue: parseInt(r.revenue),
    }));
    const total = data.reduce((sum, r) => sum + r.revenue, 0);
    res.json({ data, total });
  } catch (error) {
    next(error);
  }
};
const totalCommissionChart = async (req, res, next) => {
  try {
    const groupBy = req.query.groupBy === "year" ? "year" : "month";
    const year = req.query.year
      ? parseInt(req.query.year)
      : new Date().getFullYear();
    const companyFilter = await getCompanyFilter(req);

    let result;
    if (groupBy === "month") {
      result = await prisma.$queryRaw`
        SELECT DATE_TRUNC('month', b."createdAt") as period,
               SUM(b."commissionAmount") as commission
        FROM "Booking" b
        JOIN "Trip" t ON t.id = b."tripId"
        JOIN "Bus" bus ON bus.id = t."busId"
        WHERE b.status = 'paid'
          AND EXTRACT(year FROM b."createdAt") = ${year}
          ${companyFilter}
        GROUP BY period
        ORDER BY period ASC
      `;
    } else {
      result = await prisma.$queryRaw`
        SELECT DATE_TRUNC('year', b."createdAt") as period,
               SUM(b."commissionAmount") as commission
        FROM "Booking" b
        JOIN "Trip" t ON t.id = b."tripId"
        JOIN "Bus" bus ON bus.id = t."busId"
        WHERE b.status = 'paid'
          ${companyFilter}
        GROUP BY period
        ORDER BY period ASC
        LIMIT 5
      `;
    }

    const data = result.map((r) => ({
      period: r.period,
      commission: parseInt(r.commission),
    }));
    const total = data.reduce((sum, r) => sum + r.commission, 0);
    res.json({ data, total });
  } catch (error) {
    next(error);
  }
};
const totalBookingsChart = async (req, res, next) => {
  try {
    const groupBy = req.query.groupBy === "year" ? "year" : "month";
    const year = req.query.year
      ? parseInt(req.query.year)
      : new Date().getFullYear();

    const companyFilter = await getCompanyFilter(req);
    let result;
    if (groupBy === "month") {
      result = await prisma.$queryRaw`
        SELECT DATE_TRUNC('month', b."createdAt") as period,
               COUNT(*) as bookings
        FROM "Booking" b 
        JOIN "Trip" t On t.id = b."tripId"
        JOIN "Bus" bus ON bus.id = t."busId"
        WHERE b.status = 'paid'
          AND EXTRACT(year FROM b."createdAt") = ${year}
          ${companyFilter}
        GROUP BY period
        ORDER BY period ASC
      `;
    } else {
      result = await prisma.$queryRaw`
        SELECT DATE_TRUNC('year', b."createdAt") as period,
               COUNT(*) as bookings
        FROM "Booking" b
        JOIN "Trip" t On t.id = b."tripId"
        JOIN "Bus" bus ON bus.id = t."busId"
        WHERE b.status = 'paid'
          ${companyFilter}
        GROUP BY period
        ORDER BY period ASC
        LIMIT 5
      `;
    }

    const data = result.map((r) => ({
      period: r.period,
      bookings: parseInt(r.bookings),
    }));
    const total = data.reduce((sum, r) => sum + r.bookings, 0);
    res.json({ data, total });
  } catch (error) {
    next(error);
  }
};
const companyRevenueChart = async (req, res, next) => {
  try {
    const result = await prisma.$queryRaw`
      SELECT c.name, SUM(b."totalPrice") as revenue
      FROM "Booking" b
      JOIN "Trip" t ON t.id = b."tripId"
      JOIN "Bus" bus ON bus.id = t."busId"
      JOIN "Company" c ON c.id = bus."companyId"
      WHERE b.status = 'paid'
      GROUP BY c.id, c.name
      ORDER BY revenue DESC`;
    const data = result.map((r) => ({
      name: r.name,
      revenue: parseInt(r.revenue),
    }));
    res.json({ data });
  } catch (error) {
    next(error);
  }
};
const topRoutesChart = async (req, res, next) => {
  try {
    const companyFilter = await getCompanyFilter(req);
    const result = await prisma.$queryRaw`
    SELECT r."fromCity", r."toCity", COUNT(*) as bookings
      FROM "Booking" b
      JOIN "Trip" t ON t.id = b."tripId"
      JOIN "Bus" bus ON bus.id = t."busId"
      JOIN "Route" r ON r.id = t."routeId"
      WHERE b.status = 'paid'
      ${companyFilter}
      GROUP BY r.id, r."fromCity", r."toCity"
      ORDER BY bookings DESC
      LIMIT 5`;
    const data = result.map((r) => ({
      fromCity: r.fromCity,
      toCity: r.toCity,
      bookings: parseInt(r.bookings),
    }));
    res.json({ data });
  } catch (error) {
    next(error);
  }
};
const ALLOWED_IMAGE_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const uploadRouteImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const route = await prisma.route.findUnique({ where: { id } });
    if (!route) return res.status(404).json({ error: "Route không tồn tại" });
    if (!req.file) return res.status(400).json({ error: "Không có file ảnh" });

    const { fileTypeFromBuffer } = await import("file-type");
    const detected = await fileTypeFromBuffer(req.file.buffer);
    if (!detected || !ALLOWED_IMAGE_MIMES.includes(detected.mime)) {
      return res.status(400).json({ error: "File không phải ảnh hợp lệ" });
    }

    const fileName = `${id}.${detected.ext}`;

    const { error } = await supabase.storage
      .from("route-image")
      .upload(fileName, req.file.buffer, {
        contentType: detected.mime,
        upsert: true,
      });
    if (error) return res.status(500).json({ error: error.message });

    const { data } = supabase.storage
      .from("route-image")
      .getPublicUrl(fileName);
    await prisma.route.update({
      where: { id },
      data: { imageUrl: data.publicUrl },
    });

    res.json({ imageUrl: data.publicUrl });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  toggleUserStatus,
  getCompanyTrips,
  getCompanyBookings,
  getCompanyStats,
  getAdminStats,
  getCompanyReports,
  updateTripStatus,
  createUser,
  getCompanies,
  createCompany,
  updateCompany,
  getCompanyDrivers,
  createCompanyDriver,
  updateCompanyDriver,
  deleteCompanyDriver,
  getCompanyBuses,
  createCompanyBus,
  updateCompanyBus,
  deleteCompanyBus,
  createCompanyTrip,
  deleteCompanyTrip,
  deleteCompanyTripSeries,
  getRoutes,
  createRoute,
  uploadRouteImage,
  totalRevenueChart,
  totalBookingsChart,
  totalCommissionChart,
  topRoutesChart,
  companyRevenueChart,
};
