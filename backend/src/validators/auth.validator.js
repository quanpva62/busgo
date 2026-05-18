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

const refreshTokenValidation = [
  body("refreshToken")
    .notEmpty()
    .withMessage("Vui lòng cung cấp refresh token"),
];

const forgotPasswordValidation = [
  body("email").isEmail().withMessage("Vui lòng nhập email hợp lệ"),
];

const resetPasswordValidation = [
  body("token").notEmpty().withMessage("Thiếu token"),
  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("Mật khẩu phải có ít nhất 8 ký tự"),
];

const verifyEmailValidation = [
  body("token").notEmpty().withMessage("Thiếu token"),
];

const resendVerificationValidation = [
  body("email").isEmail().withMessage("Vui lòng nhập email hợp lệ"),
];

module.exports = {
  registerValidation,
  loginValidation,
  refreshTokenValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  verifyEmailValidation,
  resendVerificationValidation,
};
