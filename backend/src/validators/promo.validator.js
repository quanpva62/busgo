const { body } = require("express-validator");

const createPromoValidation = [
  body("code")
    .isString()
    .trim()
    .isLength({ min: 4, max: 20 })
    .matches(/^[A-Z0-9_]+$/i)
    .withMessage("Mã khuyến mãi phải là chuỗi 4-20 ký tự."),
  body("discountType")
    .isIn(["percentage", "fixed"])
    .withMessage("Loại giảm giá không hợp lệ."),
  body("discountValue")
    .isInt({ min: 1 })
    .withMessage("Giá trị giảm giá phải > 0")
    .custom((value, { req }) => {
      if (req.body.discountType === "percentage" && value > 100) {
        throw new Error("Giá trị giảm giá phần trăm không được vượt quá 100");
      }
      return true;
    }),
  body("expiresAt")
    .isISO8601()
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error("Ngày hết hạn phải là ngày trong tương lai");
      }
      return true;
    }),
  body("minPrice").optional({ nullable: true }).isInt({ min: 0 }),
  body("maxUses").optional({ nullable: true }).isInt({ min: 1 }),
  body("minBookings").optional({ nullable: true }).isInt({ min: 0 }),
  body("isActive").optional().isBoolean(),
  body("firstBookingOnly").optional().isBoolean(),
  body("oncePerUser").optional().isBoolean(),
];

const updatePromoValidation = [
  body("discountType").optional().isIn(["percentage", "fixed"]),
  body("discountValue").optional().isInt({ min: 1 }),
  body("expiresAt").optional().isISO8601(),
  body("minPrice").optional({ nullable: true }).isInt({ min: 0 }),
  body("maxUses").optional({ nullable: true }).isInt({ min: 1 }),
  body("minBookings").optional({ nullable: true }).isInt({ min: 0 }),
  body("isActive").optional().isBoolean(),
  body("firstBookingOnly").optional().isBoolean(),
  body("oncePerUser").optional().isBoolean(),
];

module.exports = { createPromoValidation, updatePromoValidation };
