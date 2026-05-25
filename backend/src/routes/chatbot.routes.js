const express = require("express");
const router = express.Router();
const chatbotController = require("../controllers/chatbot.controller");
const { optionalAuth } = require("../middlewares/auth.middleware");

// POST /api/chatbot → chatbotController.chat
router.post("/", optionalAuth, chatbotController.chat);

module.exports = router;
