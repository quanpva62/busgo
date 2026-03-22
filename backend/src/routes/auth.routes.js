const express = require("express");

const router = express.Router();
const authController = require("../controllers/auth.controller");
// import authController từ controllers/auth.controller.js

// POST /api/auth/register  → authController.register

router.post("/register", authController.register);

// POST /api/auth/login     → authController.login
router.post("/login", authController.login);

// GET  /api/auth/me        → authController.me
router.get("/me", authController.me);

module.exports = router;
