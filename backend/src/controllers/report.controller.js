const prisma = require("../lib/prisma");

const createReport = async (req, res, next) => {
  try {
    const { bookingId, driverId, category, details, severity } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { trip: true },
    });
    if (!booking) {
      return res.status(404).json({ error: "Booking không tồn tại" });
    }
    if (booking.userId !== req.user.userId) {
      return res
        .status(403)
        .json({ error: "Bạn không có quyền báo cáo booking này" });
    }
    if (booking.status !== "paid") {
      return res
        .status(400)
        .json({ error: "Chỉ có thể báo cáo cho booking đã thanh toán" });
    }
    if (booking.trip.status !== "completed") {
      return res
        .status(400)
        .json({ error: "Chỉ có thể báo cáo cho chuyến đã hoàn thành" });
    }

    const driver = await prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver) {
      return res.status(404).json({ error: "Tài xế không tồn tại" });
    }

    const report = await prisma.report.create({
      data: {
        bookingId,
        userId: req.user.userId,
        driverId,
        category,
        details,
        severity,
      },
    });

    res.status(201).json({ message: "Báo cáo đã được gửi", report });
  } catch (error) {
    next(error);
  }
};

const getMyReports = async (req, res, next) => {
  try {
    const reports = await prisma.report.findMany({
      where: { userId: req.user.userId },
      include: {
        booking: { include: { trip: { include: { route: true } } } },
        driver: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ reports });
  } catch (error) {
    next(error);
  }
};

const getReports = async (req, res, next) => {
  try {
    const reports = await prisma.report.findMany({
      include: {
        user: { select: { id: true, fullName: true } },
        driver: { select: { id: true, fullName: true } },
        booking: { include: { trip: { include: { route: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ reports });
  } catch (error) {
    next(error);
  }
};

const updateReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;
    const report = await prisma.report.findUnique({
      where: { id },
      include: { driver: true },
    });
    if (!report) return res.status(404).json({ error: "Report không tồn tại" });

    if (req.user.role === "company_admin") {
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
      });
      if (report.driver.companyId !== user.companyId) {
        return res
          .status(403)
          .json({ error: "Bạn không có quyền xử lý report này" });
      }
    }

    const updated = await prisma.report.update({
      where: { id },
      data: {
        status,
        adminNote,
        resolvedBy: req.user.userId,
        resolvedAt: ["resolved", "dismissed"].includes(status)
          ? new Date()
          : undefined,
      },
    });
    res.json({ message: "Đã cập nhật report", report: updated });
  } catch (error) {
    next(error);
  }
};

module.exports = { createReport, getMyReports, getReports, updateReport };
