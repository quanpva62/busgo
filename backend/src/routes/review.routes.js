const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/review.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const {
  reviewValidation,
  updateReviewValidation,
} = require("../validators/review.validator");
const validate = require("../middlewares/validate.middleware");
// POST /api/reviews → reviewController.createReview
router.post(
  "/",
  authMiddleware,
  reviewValidation,
  validate,
  reviewController.createReview,
);

// PUT /api/reviews/:id → reviewController.updateReview
router.put(
  "/:id",
  authMiddleware,
  updateReviewValidation,
  validate,
  reviewController.updateReview,
);

// GET /api/reviews/trip/:tripId → reviewController.getReviewsByTrip
router.get("/trip/:tripId", reviewController.getReviewsByTrip);

module.exports = router;
