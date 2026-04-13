const { body } = require("express-validator");

const reviewValidation = [
  body("bookingId").notEmpty().withMessage("Vui lòng cung cấp bookingId"),
  body("tripId").notEmpty().withMessage("Vui lòng cung cấp tripId"),
  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating phải là số nguyên từ 1 đến 5"),
  body("comment").optional().isString().withMessage("Comment phải là chuỗi"),
];

const updateReviewValidation = [
  body("rating")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating phải từ 1 đến 5"),
  body("comment").optional().isString().withMessage("Comment phải là chuỗi"),
];

module.exports = { reviewValidation, updateReviewValidation };
