const { query } = require("express-validator");

const searchTripValidation = [
  query("from").notEmpty().withMessage("Vui lòng nhập điểm đi"),
  query("to").notEmpty().withMessage("Vui lòng nhập điểm đến"),
  query("date")
    .optional()
    .isISO8601()
    .withMessage("Ngày không hợp lệ (YYYY-MM-DD)"),
];

module.exports = {
  searchTripValidation,
};
