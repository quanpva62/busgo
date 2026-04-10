const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/booking.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { bookingValidation } = require("../validators/booking.validator");
const validate = require("../middlewares/validate.middleware");

// POST /api/bookings → bookingController.createBooking
router.post(
  "/",
  authMiddleware,
  bookingValidation,
  validate,
  bookingController.createBooking,
);

// GET /api/bookings → bookingController.getBookings
router.get("/:id", authMiddleware, bookingController.getBooking);

router.delete(
  "/:bookingId/cancel",
  authMiddleware,
  bookingController.cancelBooking,
);

module.exports = router;
