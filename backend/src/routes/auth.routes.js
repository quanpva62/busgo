const express = require("express");

const router = express.Router();
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const {
  registerValidation,
  loginValidation,
} = require("../validators/auth.validator");
const validate = require("../middlewares/validate.middleware");
// import authController từ controllers/auth.controller.js

// POST /api/auth/register  → authController.register

router.post("/register", registerValidation, validate, authController.register);

// POST /api/auth/login     → authController.login
router.post("/login", loginValidation, validate, authController.login);

// GET  /api/auth/me        → authController.me
router.get("/me", authMiddleware, authController.me);

module.exports = router;
