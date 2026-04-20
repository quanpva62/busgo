const { body } = require("express-validator");

const bookingValidation = [
  body("tripId").notEmpty().withMessage("Vui lòng cung cấp tripId"),
  body("seatIds")
    .isArray({ min: 1 })
    .withMessage("Vui lòng cung cấp ít nhất một seatId"),
  body("passengerName").notEmpty().withMessage("Vui lòng nhập tên hành khách"),
  body("passengerPhone")
    .isMobilePhone("vi-VN")
    .withMessage("Vui lòng nhập số điện thoại hợp lệ"),
  body("passengerEmail")
    .optional()
    .isEmail()
    .withMessage("Vui lòng nhập email hợp lệ"),
];

module.exports = {
  bookingValidation,
};
