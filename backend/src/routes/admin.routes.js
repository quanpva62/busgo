const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { isAdmin, isCompanyAdmin } = require("../middlewares/role.middleware");

router.get("/users", authMiddleware, isAdmin, adminController.getUsers);
router.patch(
  "/users/:userId/status",
  authMiddleware,
  isAdmin,
  adminController.toggleUserStatus,
);
router.get(
  "/company/trips",
  authMiddleware,
  isCompanyAdmin,
  adminController.getCompanyTrips,
);
router.get(
  "/company/bookings",
  authMiddleware,
  isCompanyAdmin,
  adminController.getCompanyBookings,
);
router.get(
  "/company/stats",
  authMiddleware,
  isCompanyAdmin,
  adminController.getCompanyStats,
);
module.exports = router;
