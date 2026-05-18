const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const {
  authLimit,
  passwordResetLimit,
} = require("../middlewares/rateLimit.middleware");
const {
  registerValidation,
  loginValidation,
  refreshTokenValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  verifyEmailValidation,
  resendVerificationValidation,
} = require("../validators/auth.validator");

// ───── Public: Sign-up & Sign-in ─────
router.post("/register", authLimit, registerValidation, validate, authController.register);
router.post("/login", authLimit, loginValidation, validate, authController.login);
router.post("/google", authLimit, authController.googleLogin);

// ───── Email verification ─────
router.post("/verify-email", verifyEmailValidation, validate, authController.verifyEmail);
router.post("/resend-verification", passwordResetLimit, resendVerificationValidation, validate, authController.resendVerification);

// ───── Password reset (forgot flow) ─────
router.post("/forgot-password", passwordResetLimit, forgotPasswordValidation, validate, authController.forgotPassword);
router.post("/reset-password", passwordResetLimit, resetPasswordValidation, validate, authController.resetPassword);

// ───── Session ─────
router.post("/refresh-token", refreshTokenValidation, validate, authController.refreshToken);

// ───── Authenticated: profile ─────
router.get("/me", authMiddleware, authController.me);
router.patch("/me", authMiddleware, authController.updateMe);
router.patch("/password", authMiddleware, authController.changePassword);

module.exports = router;
