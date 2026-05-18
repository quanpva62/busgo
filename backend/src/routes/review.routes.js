const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/review.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const {
  createReviewValidation,
  updateReviewValidation,
} = require("../validators/review.validator");

router.post(
  "/",
  authMiddleware,
  createReviewValidation,
  validate,
  reviewController.createReview,
);
router.patch(
  "/:reviewId",
  authMiddleware,
  updateReviewValidation,
  validate,
  reviewController.updateReview,
);
router.get("/trip/:tripId", reviewController.getTripReviews); // public

module.exports = router;
