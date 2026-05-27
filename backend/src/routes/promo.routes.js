const express = require("express");
const router = express.Router();
const promosController = require("../controllers/promos.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { isAdmin } = require("../middlewares/role.middleware");
const {
  createPromoValidation,
  updatePromoValidation,
} = require("../validators/promo.validator");
const validate = require("../middlewares/validate.middleware");

// Public route to get active promos
router.get("/active", promosController.getActivePromos);

// Admin only - CRUD
router.get("/", authMiddleware, isAdmin, promosController.getPromos);
router.post(
  "/",
  authMiddleware,
  isAdmin,
  createPromoValidation,
  validate,
  promosController.createPromo,
);
router.patch(
  "/:id",
  authMiddleware,
  isAdmin,
  updatePromoValidation,
  validate,
  promosController.updatePromo,
);
router.delete("/:id", authMiddleware, isAdmin, promosController.deletePromo);

module.exports = router;
