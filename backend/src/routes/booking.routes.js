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

// GET /api/bookings/my → bookingController.getMyBookings
router.get("/my", authMiddleware, bookingController.getMyBookings);

// GET /api/bookings/:id → bookingController.getBooking
router.get("/:id", authMiddleware, bookingController.getBooking);

router.delete(
  "/:id/cancel",
  authMiddleware,
  bookingController.cancelBooking,
);

module.exports = router;
