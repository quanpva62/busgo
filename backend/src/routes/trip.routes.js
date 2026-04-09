const express = require("express");
const router = express.Router();
const tripController = require("../controllers/trip.controller");
const { searchTripValidation } = require("../validators/trip.validator");
const validate = require("../middlewares/validate.middleware");

router.get("/", searchTripValidation, validate, tripController.searchTrip);
router.get("/:id", tripController.getTripDetail);
router.get("/:id/seats", tripController.getTripSeats);

module.exports = router;
