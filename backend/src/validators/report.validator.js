const { body } = require("express-validator");

const reportValidation = [
  body("bookingId").notEmpty().isUUID().withMessage("Vui lòng cung cấp bookingId hợp lệ"),
  body("driverId").notEmpty().isUUID().withMessage("Vui lòng cung cấp driverId hợp lệ"),
  body("category")
    .isIn([
      "dangerous_driving",
      "phone_while_driving",
      "wrong_vehicle",
      "dirty_vehicle",
      "wrong_stop",
      "late_departure",
      "rude_behavior",
      "overcharge",
      "other",
    ])
    .withMessage("Category không hợp lệ"),
  body("details").notEmpty().isString().withMessage("Vui lòng nhập nội dung báo cáo"),
  body("severity")
    .isIn(["low", "medium", "high"])
    .withMessage("Severity phải là low, medium hoặc high"),
];

const updateReportValidation = [
  body("status")
    .isIn(["pending", "reviewing", "resolved", "dismissed"])
    .withMessage("Trạng thái không hợp lệ"),
  body("adminNote").optional().isString(),
];

module.exports = { reportValidation, updateReportValidation };
