const prisma = require("../lib/prisma");

const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (user.role === "admin") {
      return res
        .status(403)
        .json({ error: "Cannot change status of admin user" });
    }
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
    });
    res.json({
      message: `User ${updatedUser.isActive ? "activated" : "deactivated"} successfully`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getCompanyTrips = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { companyId } = user;
    const trips = await prisma.trip.findMany({
      where: { bus: { companyId } },
      include: {
        bus: true,
        driver: true,
        assistant: true,
        route: true,
      },
    });

    res.json(trips);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getCompanyBookings = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const { companyId } = user;
    const bookings = await prisma.booking.findMany({
      where: { trip: { bus: { companyId } } },
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
    });
    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getCompanyStats = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
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
      _sum: { totalPrice: true },
    });
    res.json({
      totalTrips,
      totalBookings,
      totalRevenue: totalRevenue._sum.totalPrice,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  getUsers,
  toggleUserStatus,
  getCompanyTrips,
  getCompanyBookings,
  getCompanyStats,
};
