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

module.exports = {
  getTicketsByBooking,
};
