const express = require("express");
const router = express.Router();
const ticketController = require("../controllers/ticket.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// GET /api/tickets/:bookingId → ticketController.getTicketsByBooking
router.get("/:bookingId", authMiddleware, ticketController.getTicketsByBooking);

module.exports = router;
