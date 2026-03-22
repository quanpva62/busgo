const { body } = require("express-validator");

const registerValidation = [
  body("fullName").notEmpty().withMessage("Vui lòng nhập đầy đủ họ tên"),

  body("email").isEmail().withMessage("Vui lòng nhập email hợp lệ"),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Mật khẩu phải có ít nhất 8 ký tự"),

  body("phone")
    .isMobilePhone("vi-VN")
    .withMessage("Vui lòng nhập số điện thoại hợp lệ"),
];

const loginValidation = [
  body("email").isEmail().withMessage("Vui lòng nhập email hợp lệ"),

  body("password").notEmpty().withMessage("Vui lòng nhập mật khẩu"),
];

module.exports = {
  registerValidation,
  loginValidation,
};
