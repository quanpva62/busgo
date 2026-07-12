const prisma = require("../lib/prisma");

const getTicketsByBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return res.status(404).json({ error: "Không tìm thấy booking" });
    }
    if (booking.userId !== req.user.userId) {
      return res.status(403).json({ error: "Vé này không thuộc về bạn!" });
    }
    const ticket = await prisma.ticket.findUnique({
      where: { bookingId },
      include: {
        booking: {
          include: {
            trip: {
              include: {
                route: true,
                bus: { include: { company: true } },
              },
            },
            bookingSeats: { include: { seat: { include: { seat: true } } } },
          },
        },
      },
    });

    if (!ticket) {
      return res
        .status(404)
        .json({ error: "Không tìm thấy vé nào cho booking này" });
    }
    res.json(ticket);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    next(error);
  }
};

const checkinTicket = async (req, res, next) => {
  try {
    const { qrCode } = req.body;
    if (!qrCode) {
      return res.status(400).json({ error: "Thiếu mã QR" });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { qrCode },
      include: {
        booking: {
          include: {
            trip: {
              include: {
                route: true,
                bus: { include: { company: true } },
              },
            },
            bookingSeats: { include: { seat: { include: { seat: true } } } },
          },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({ error: "Không tìm thấy vé" });
    }
    if (req.user.role !== "admin") {
      const u = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { companyId: true },
      });
      const ticketCompanyId = ticket.booking.trip.bus?.companyId;
      if (!u.companyId || u.companyId !== ticketCompanyId) {
        return res
          .status(403)
          .json({ error: "Vé này không thuộc về công ty của bạn!" });
      }
    }

    if (ticket.isUsed) {
      return res
        .status(400)
        .json({ error: "Vé đã được sử dụng", usedAt: ticket.usedAt, ticket });
    }

    if (ticket.booking.status !== "paid") {
      return res
        .status(400)
        .json({ error: `Vé chưa được thanh toán: ${ticket.booking.status}` });
    }

    // Check-in chỉ đánh dấu vé đã dùng; booking giữ nguyên "paid"
    const updated = await prisma.ticket.update({
      where: { id: ticket.id },
      data: { isUsed: true, usedAt: new Date() },
    });
    res.json({
      message: "Check-in thành công",
      ticket: { ...ticket, ...updated },
    });
  } catch (error) {
    console.error("Error during check-in:", error);
    next(error);
  }
};
// Danh sách chuyến (hôm nay trở đi) của công ty mà staff thuộc về
const getStaffTrips = async (req, res, next) => {
  try {
    let companyFilter = {};
    if (req.user.role !== "admin") {
      const u = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { companyId: true },
      });
      if (!u?.companyId) {
        return res
          .status(403)
          .json({ error: "Tài khoản chưa thuộc công ty nào" });
      }
      companyFilter = { bus: { companyId: u.companyId } };
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const trips = await prisma.trip.findMany({
      where: { ...companyFilter, departureTime: { gte: startOfToday } },
      include: {
        route: true,
        bus: true,
        _count: { select: { bookings: { where: { status: "paid" } } } },
      },
      orderBy: { departureTime: "asc" },
      take: 50,
    });
    res.json(trips);
  } catch (error) {
    next(error);
  }
};

// Danh sách hành khách của 1 chuyến (staff cùng công ty hoặc admin)
const getTripPassengers = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { route: true, bus: true },
    });
    if (!trip) {
      return res.status(404).json({ error: "Không tìm thấy chuyến xe" });
    }

    if (req.user.role !== "admin") {
      const u = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { companyId: true },
      });
      if (!u?.companyId || u.companyId !== trip.bus.companyId) {
        return res
          .status(403)
          .json({ error: "Chuyến xe này không thuộc công ty của bạn!" });
      }
    }

    const bookings = await prisma.booking.findMany({
      where: { tripId, status: { in: ["paid", "pending"] } },
      include: {
        bookingSeats: { include: { seat: { include: { seat: true } } } },
        ticket: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const passengers = bookings.map((b) => ({
      bookingId: b.id,
      passengerName: b.passengerName,
      passengerPhone: b.passengerPhone,
      status: b.status,
      seats: b.bookingSeats.map((bs) => bs.seat.seat.seatLabel),
      ticketCode: b.ticket?.ticketCode ?? null,
      checkedIn: b.ticket?.isUsed ?? false,
      usedAt: b.ticket?.usedAt ?? null,
    }));

    const seatGroups = await prisma.tripSeat.groupBy({
      by: ["status"],
      where: { tripId },
      _count: { _all: true },
    });
    const seatSummary = { available: 0, held: 0, booked: 0 };
    for (const g of seatGroups) seatSummary[g.status] = g._count._all;

    res.json({ trip, passengers, seatSummary });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTicketsByBooking,
  checkinTicket,
  getStaffTrips,
  getTripPassengers,
};
