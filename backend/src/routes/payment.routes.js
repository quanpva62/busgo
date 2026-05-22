const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { apiLimit } = require("../middlewares/rateLimit.middleware");

// POST /api/payments/create → paymentController.createPayment
router.post("/create", apiLimit, authMiddleware, paymentController.createPayment);

// GET /vnpay-return -> vnpayReturn (callback từ VNPay, KHÔNG rate limit để không miss)
router.get("/vnpay-return", paymentController.vnpayReturn);

module.exports = router;
