const express = require("express");
const router = express.Router();
const reportController = require("../controllers/report.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const { isAdmin, isCompanyAdmin } = require("../middlewares/role.middleware");
const { reportValidation } = require("../validators/report.validator");

// POST / → reportController.createReport
router.post(
  "/",
  authMiddleware,
  reportValidation,
  validate,
  reportController.createReport,
);

// GET /my → reportController.getMyReports
router.get("/my", authMiddleware, reportController.getMyReports);

// GET / → reportController.getReports (admin only)
router.get("/", authMiddleware, isAdmin, reportController.getReports);

// PATCH /:id → updateReport (admin + companyadmin)
router.patch("/:id", authMiddleware, isCompanyAdmin, reportController.updateReport);

module.exports = router;
