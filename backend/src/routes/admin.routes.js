const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const exportController = require("../controllers/export.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { isAdmin, isCompanyAdmin } = require("../middlewares/role.middleware");
const upload = require("../middlewares/upload.middleware");
const validate = require("../middlewares/validate.middleware");
const { updateTripStatusValidation } = require("../validators/trip.validator");

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
router.get("/stats", authMiddleware, isAdmin, adminController.getAdminStats);
router.get(
  "/company/reports",
  authMiddleware,
  isCompanyAdmin,
  adminController.getCompanyReports,
);
router.patch(
  "/company/trips/:id/status",
  authMiddleware,
  isCompanyAdmin,
  updateTripStatusValidation,
  validate,
  adminController.updateTripStatus,
);
router.get(
  "/revenue-chart",
  authMiddleware,
  isCompanyAdmin,
  adminController.totalRevenueChart,
);
router.get(
  "/bookings-chart",
  authMiddleware,
  isCompanyAdmin,
  adminController.totalBookingsChart,
);
router.get(
  "/commission-chart",
  authMiddleware,
  isCompanyAdmin,
  adminController.totalCommissionChart,
);
router.get(
  "/top-routes-chart",
  authMiddleware,
  isCompanyAdmin,
  adminController.topRoutesChart,
);
router.get(
  "/company-revenue-chart",
  authMiddleware,
  isAdmin,
  adminController.companyRevenueChart,
);
router.post("/users", authMiddleware, isAdmin, adminController.createUser);
router.get("/companies", authMiddleware, isAdmin, adminController.getCompanies);
router.post(
  "/companies",
  authMiddleware,
  isAdmin,
  adminController.createCompany,
);
router.patch(
  "/companies/:id",
  authMiddleware,
  isAdmin,
  adminController.updateCompany,
);

router.get(
  "/routes",
  authMiddleware,
  isCompanyAdmin,
  adminController.getRoutes,
);
router.post("/routes", authMiddleware, isAdmin, adminController.createRoute);
router.post(
  "/routes/:id/image",
  authMiddleware,
  isAdmin,
  upload.single("image"),
  adminController.uploadRouteImage,
);

router.get(
  "/company/drivers",
  authMiddleware,
  isCompanyAdmin,
  adminController.getCompanyDrivers,
);
router.post(
  "/company/drivers",
  authMiddleware,
  isCompanyAdmin,
  adminController.createCompanyDriver,
);
router.patch(
  "/company/drivers/:id",
  authMiddleware,
  isCompanyAdmin,
  adminController.updateCompanyDriver,
);
router.delete(
  "/company/drivers/:id",
  authMiddleware,
  isCompanyAdmin,
  adminController.deleteCompanyDriver,
);

router.get(
  "/company/buses",
  authMiddleware,
  isCompanyAdmin,
  adminController.getCompanyBuses,
);
router.post(
  "/company/buses",
  authMiddleware,
  isCompanyAdmin,
  adminController.createCompanyBus,
);
router.patch(
  "/company/buses/:id",
  authMiddleware,
  isCompanyAdmin,
  adminController.updateCompanyBus,
);
router.delete(
  "/company/buses/:id",
  authMiddleware,
  isCompanyAdmin,
  adminController.deleteCompanyBus,
);

router.post(
  "/company/trips",
  authMiddleware,
  isCompanyAdmin,
  adminController.createCompanyTrip,
);
router.delete(
  "/company/trips/:id",
  authMiddleware,
  isCompanyAdmin,
  adminController.deleteCompanyTrip,
);
router.delete(
  "/company/trips/series/:seriesId",
  authMiddleware,
  isCompanyAdmin,
  adminController.deleteCompanyTripSeries,
);

router.get(
  "/export/users",
  authMiddleware,
  isAdmin,
  exportController.exportUsers,
);
router.get(
  "/export/bookings",
  authMiddleware,
  isCompanyAdmin,
  exportController.exportBookings,
);
router.get(
  "/export/reports",
  authMiddleware,
  isCompanyAdmin,
  exportController.exportReports,
);

module.exports = router;
