const prisma = require("../lib/prisma");

const searchTrip = async (req, res, next) => {
  try {
    const { from, to, date, busType, maxPrice } = req.query;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let timeFilter;
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      timeFilter = { gte: startOfDay, lte: endOfDay };
    } else {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      timeFilter = { gte: now };
    }

    const routeFilter = {};
    if (from) routeFilter.fromCity = from;
    if (to) routeFilter.toCity = to;

    // Bus type filter — comma-separated: "sleeper,standard"
    const busTypes = busType
      ? String(busType).split(",").filter(Boolean)
      : [];

    const where = {
      ...(Object.keys(routeFilter).length && { route: routeFilter }),
      ...(busTypes.length > 0 && { bus: { busType: { in: busTypes } } }),
      ...(maxPrice && { price: { lte: Number(maxPrice) } }),
      departureTime: timeFilter,
      status: { not: "cancelled" },
    };

    const [trips, total] = await Promise.all([
      prisma.trip.findMany({
        where,
        include: {
          route: true,
          bus: { include: { company: true } },
          driver: true,
        },
        orderBy: { departureTime: "asc" },
        skip,
        take: limit,
      }),
      prisma.trip.count({ where }),
    ]);

    res.json({
      trips,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

const getTripDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const trip = await prisma.trip.findUnique({
      where: { id: id },
      include: {
        bus: { include: { company: true } },
        driver: {
          include: {
            _count: {
              select: { tripsAsDriver: { where: { status: "completed" } } },
            },
          },
        },
        assistant: true,
        route: true,
      },
    });
    res.json(trip);
  } catch (error) {
    next(error);
  }
};

const getTripSeats = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tripSeats = await prisma.tripSeat.findMany({
      where: { tripId: id },
      include: {
        seat: true,
        booking: { select: { userId: true } },
      },
    });
    res.json(tripSeats);
  } catch (error) {
    next(error);
  }
};

const getAllRoutes = async (req, res, next) => {
  try {
    const routes = await prisma.route.findMany({
      where: { isActive: true },
      orderBy: { fromCity: "asc" },
    });
    res.json(routes);
  } catch (error) {
    next(error);
  }
};

const getUpcomingTrips = async (req, res, next) => {
  try {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const trips = await prisma.trip.findMany({
      where: {
        departureTime: { gte: now, lte: in24h },
        status: "scheduled",
      },
      include: {
        route: true,
        bus: { include: { company: true } },
        _count: { select: { tripSeats: { where: { status: "available" } } } },
      },
      orderBy: { departureTime: "asc" },
      take: 12,
    });

    const data = trips.map((t) => ({
      id: t.id,
      fromCity: t.route.fromCity,
      toCity: t.route.toCity,
      departureTime: t.departureTime,
      price: t.price,
      busType: t.bus.busType,
      companyName: t.bus.company?.name,
      availableSeats: t._count.tripSeats,
    }));
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const getPopularRoutes = async (req, res, next) => {
  try {
    const result = await prisma.$queryRaw`
      SELECT r.id, r."fromCity", r."toCity", r."distanceKm", r."estimatedDuration", r."imageUrl",
             COUNT(b.id) as bookings,
             MIN(t.price) as "minPrice"
      FROM "Booking" b
      JOIN "Trip" t ON t.id = b."tripId"
      JOIN "Route" r ON r.id = t."routeId"
      WHERE b.status = 'paid'
      GROUP BY r.id, r."fromCity", r."toCity", r."distanceKm", r."estimatedDuration", r."imageUrl"
      ORDER BY bookings DESC
      LIMIT 3
    `;
    const data = result.map((r) => ({
      id: r.id,
      fromCity: r.fromCity,
      toCity: r.toCity,
      distanceKm: r.distanceKm,
      estimatedDuration: parseInt(r.estimatedDuration),
      imageUrl: r.imageUrl,
      bookings: parseInt(r.bookings),
      minPrice: parseInt(r.minPrice),
    }));
    res.json(data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchTrip,
  getTripDetail,
  getTripSeats,
  getAllRoutes,
  getUpcomingTrips,
  getPopularRoutes,
};
