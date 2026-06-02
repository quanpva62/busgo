const { body } = require("express-validator");

const bookingValidation = [
  body("tripId").notEmpty().withMessage("Vui lòng cung cấp tripId"),
  body("seatIds")
    .isArray({ min: 1, max: 4 })
    .withMessage("Vui lòng cung cấp từ 1 đến 4 seatId")
    .custom((arr) => {
      if (new Set(arr).size !== arr.length) {
        throw new Error("Không được chọn trùng ghế");
      }
      return true;
    }),
  body("passengerName").notEmpty().withMessage("Vui lòng nhập tên hành khách"),
  body("passengerPhone")
    .isMobilePhone("vi-VN")
    .withMessage("Vui lòng nhập số điện thoại hợp lệ"),
  body("passengerEmail")
    .optional()
    .isEmail()
    .withMessage("Vui lòng nhập email hợp lệ"),
  body("promoCode")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Mã khuyến mãi không hợp lệ"),
];

module.exports = {
  bookingValidation,
};
