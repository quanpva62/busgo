const express = require("express");

const router = express.Router();
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const {
  registerValidation,
  loginValidation,
  refreshTokenValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
} = require("../validators/auth.validator");
const validate = require("../middlewares/validate.middleware");

// import authController từ controllers/auth.controller.js

// POST /api/auth/register  → authController.register

router.post("/register", registerValidation, validate, authController.register);

// POST /api/auth/login     → authController.login
router.post("/login", loginValidation, validate, authController.login);

// POST /api/auth/refresh-token → authController.refreshToken
router.post(
  "/refresh-token",
  refreshTokenValidation,
  validate,
  authController.refreshToken,
);

// GET  /api/auth/me        → authController.me
router.get("/me", authMiddleware, authController.me);

// PATCH /api/auth/me       → authController.updateMe
router.patch("/me", authMiddleware, authController.updateMe);

// PATCH /api/auth/password → authController.changePassword
router.patch("/password", authMiddleware, authController.changePassword);

// POST /api/auth/google    → authController.googleLogin
router.post("/google", authController.googleLogin);

// POST /api/auth/forgot-password
router.post(
  "/forgot-password",
  forgotPasswordValidation,
  validate,
  authController.forgotPassword,
);

// POST /api/auth/reset-password
router.post(
  "/reset-password",
  resetPasswordValidation,
  validate,
  authController.resetPassword,
);

module.exports = router;
