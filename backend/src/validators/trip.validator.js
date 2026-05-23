const { query, body } = require("express-validator");

const searchTripValidation = [
  query("from").optional(),
  query("to").optional(),
  query("date")
    .optional()
    .isISO8601()
    .withMessage("Ngày không hợp lệ (YYYY-MM-DD)"),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 20 }).toInt(),
];

const updateTripStatusValidation = [
  body("status")
    .isIn(["scheduled", "running", "completed", "cancelled"])
    .withMessage("Trạng thái chuyến không hợp lệ"),
];

module.exports = {
  searchTripValidation,
  updateTripStatusValidation,
};
