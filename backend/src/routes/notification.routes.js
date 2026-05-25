const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notification.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { sseAuth } = require("../middlewares/auth.middleware");

router.get("/my", authMiddleware, notificationController.getMyNotifications);
router.get("/stream", sseAuth, notificationController.stream);
router.patch("/read-all", authMiddleware, notificationController.markAllRead);
router.patch("/:id/read", authMiddleware, notificationController.markRead);

module.exports = router;
