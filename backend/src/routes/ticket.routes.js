const express = require("express");
const router = express.Router();
const ticketController = require("../controllers/ticket.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { isStaff } = require("../middlewares/role.middleware");

// Các route tĩnh phải đặt TRƯỚC "/:bookingId" để không bị nuốt param

// GET /api/tickets/trips → danh sách chuyến của công ty (staff)
router.get("/trips", authMiddleware, isStaff, ticketController.getStaffTrips);

// GET /api/tickets/trips/:tripId/passengers → danh sách khách của chuyến
router.get(
  "/trips/:tripId/passengers",
  authMiddleware,
  isStaff,
  ticketController.getTripPassengers,
);

// GET /api/tickets/:bookingId → ticketController.getTicketsByBooking
router.get("/:bookingId", authMiddleware, ticketController.getTicketsByBooking);

// POST /api/tickets/checkin → ticketController.checkinTicket
router.post(
  "/checkin",
  authMiddleware,
  isStaff,
  ticketController.checkinTicket,
);
module.exports = router;
