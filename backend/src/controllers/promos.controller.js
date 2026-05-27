const prisma = require("../lib/prisma");

const getPromos = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [promos, total] = await Promise.all([
      prisma.promotion.findMany({
        orderBy: { expiresAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.promotion.count(),
    ]);
    res.json({ promos, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

const createPromo = async (req, res, next) => {
  try {
    const promo = await prisma.promotion.create({
      data: {
        code: req.body.code.toUpperCase(),
        discountType: req.body.discountType,
        discountValue: req.body.discountValue,
        minPrice: req.body.minPrice || null,
        maxUses: req.body.maxUses || null,
        expiresAt: new Date(req.body.expiresAt),
        isActive: req.body.isActive ?? true,
        firstBookingOnly: req.body.firstBookingOnly ?? false,
        oncePerUser: req.body.oncePerUser ?? false,
        minBookings: req.body.minBookings || null,
      },
    });
    res.status(201).json({ promo });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(400).json({ error: "Mã khuyến mãi đã tồn tại" });
    }
    next(error);
  }
};

const updatePromo = async (req, res, next) => {
  try {
    const promo = await prisma.promotion.update({
      where: { id: req.params.id },
      data: {
        discountType: req.body.discountType,
        discountValue: req.body.discountValue,
        minPrice: req.body.minPrice,
        maxUses: req.body.maxUses,
        expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined,
        isActive: req.body.isActive,
        firstBookingOnly: req.body.firstBookingOnly,
        oncePerUser: req.body.oncePerUser,
        minBookings: req.body.minBookings,
      },
    });
    res.json({ promo });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Không tìm thấy mã khuyến mãi" });
    }
    if (error.code === "P2002") {
      return res.status(400).json({ error: "Mã khuyến mãi đã tồn tại" });
    }
    next(error);
  }
};

const deletePromo = async (req, res, next) => {
  try {
    const id = req.params.id;
    const usedCount = await prisma.booking.count({
      where: {
        promoId: id,
      },
    });
    if (usedCount > 0) {
      return res
        .status(400)
        .json({ error: "Không thể xóa mã khuyến mãi đã được sử dụng" });
    }
    await prisma.promotion.delete({
      where: { id },
    });
    res.json({ message: "Xóa mã khuyến mãi thành công" });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Không tìm thấy mã khuyến mãi" });
    }
    next(error);
  }
};

const getActivePromos = async (req, res, next) => {
  try {
    const promos = await prisma.promotion.findMany({
      where: {
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: { expiresAt: "desc" },
    });
    res.json({ promos });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPromos,
  createPromo,
  updatePromo,
  deletePromo,
  getActivePromos,
};
