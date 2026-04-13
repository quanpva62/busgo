const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// POST /api/payments → paymentController.createPayment
router.post("/create", authMiddleware, paymentController.createPayment);

// GET /vnpau-return -> vnpayReturn
router.get("/vnpay-return", paymentController.vnpayReturn);

module.exports = router;
