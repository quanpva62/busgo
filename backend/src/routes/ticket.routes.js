const express = require("express");
const router = express.Router();
const ticketController = require("../controllers/ticket.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { isStaff } = require("../middlewares/role.middleware");

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
