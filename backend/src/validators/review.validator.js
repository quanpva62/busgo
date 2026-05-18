const { body } = require("express-validator");

const createReviewValidation = [
  body("bookingId")
    .notEmpty()
    .isUUID()
    .withMessage("Vui lòng cung cấp bookingId hợp lệ"),
  body("rating")
    .notEmpty()
    .isInt({ min: 1, max: 5 })
    .withMessage("Vui lòng cung cấp đánh giá hợp lệ (1-5)"),
  body("comment")
    .optional()
    .isLength({ max: 200 })
    .withMessage("Vui lòng nhập bình luận không quá 200 ký tự"),
];

const updateReviewValidation = [
  body("rating")
    .notEmpty()
    .isInt({ min: 1, max: 5 })
    .withMessage("Vui lòng cung cấp đánh giá hợp lệ (1-5)"),
  body("comment")
    .optional()
    .isLength({ max: 200 })
    .withMessage("Vui lòng nhập bình luận không quá 200 ký tự"),
];
module.exports = { createReviewValidation, updateReviewValidation };
