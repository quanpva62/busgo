const express = require("express");
const router = express.Router();
const tripController = require("../controllers/trip.controller");
const { searchTripValidation } = require("../validators/trip.validator");
const validate = require("../middlewares/validate.middleware");

router.get("/popular", tripController.getPopularRoutes);
router.get("/upcoming", tripController.getUpcomingTrips);
router.get("/routes", tripController.getAllRoutes);
router.get("/", searchTripValidation, validate, tripController.searchTrip);
router.get("/:id", tripController.getTripDetail);
router.get("/:id/seats", tripController.getTripSeats);

module.exports = router;
