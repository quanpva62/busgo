const prisma = require("../lib/prisma");

const searchTrip = async (req, res) => {
  try {
    const { from, to, date } = req.query;

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const trips = await prisma.trip.findMany({
      where: {
        route: { fromCity: from, toCity: to },
        departureTime: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        route: true,
        bus: { include: { company: true } },
        driver: true,
      },
    });
    res.json(trips);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTripDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const trip = await prisma.trip.findUnique({
      where: { id: id },
      include: {
        bus: { include: { company: true } },
        driver: true,
        assistant: true,
        route: true,
      },
    });
    res.json(trip);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTripSeats = async (req, res) => {
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
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  searchTrip,
  getTripDetail,
  getTripSeats,
};
