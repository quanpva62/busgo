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
            trip: { include: { route: true } },
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
      if (u.companyId !== ticketCompanyId) {
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

    const [updated] = await prisma.$transaction([
      prisma.ticket.update({
        where: { id: ticket.id },
        data: { isUsed: true, usedAt: new Date() },
      }),
      prisma.booking.update({
        where: { id: ticket.bookingId },
        data: { status: "completed" },
      }),
    ]);
    res.json({
      message: "Check-in thành công",
      ticket: { ...ticket, ...updated },
    });
  } catch (error) {
    console.error("Error during check-in:", error);
    next(error);
  }
};
module.exports = {
  getTicketsByBooking,
  checkinTicket,
};
