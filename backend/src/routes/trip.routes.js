const express = require("express");
const router = express.Router();
const tripController = require("../controllers/trip.controller");

router.get("/", tripController.searchTrip);
router.get("/:id", tripController.getTripDetail);
router.get("/:id/seats", tripController.getTripSeats);

module.exports = router;
