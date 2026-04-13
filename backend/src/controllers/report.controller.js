const prisma = require("../lib/prisma");

const createReport = async (req, res) => {
  try {
    const { bookingId, driverId, category, details, severity } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) {
      return res.status(404).json({ error: "Booking không tồn tại" });
    }
    if (booking.userId !== req.user.userId) {
      return res.status(403).json({ error: "Bạn không có quyền báo cáo booking này" });
    }
    if (booking.status !== "paid") {
      return res.status(400).json({ error: "Chỉ có thể báo cáo cho booking đã thanh toán" });
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
    console.error("Error creating report:", error);
    res.status(500).json({ error: "Lỗi máy chủ" });
  }
};

const getReports = async (req, res) => {
  try {
    const reports = await prisma.report.findMany({
      include: {
        user: { select: { id: true, fullName: true } },
        driver: { select: { id: true, fullName: true } },
        booking: { select: { id: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ reports });
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ error: "Lỗi máy chủ" });
  }
};

module.exports = { createReport, getReports };
