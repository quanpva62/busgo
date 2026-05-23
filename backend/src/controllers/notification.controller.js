const prisma = require("../lib/prisma");

const getMyNotifications = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);
    res.json({ notifications, unreadCount });
  } catch (error) {
    next(error);
  }
};

const markRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== req.user.userId) {
      return res.status(404).json({ error: "Không tìm thấy thông báo" });
    }
    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    res.json({ message: "Đã đánh dấu đã đọc" });
  } catch (error) {
    next(error);
  }
};

const markAllRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.userId, isRead: false },
      data: { isRead: true },
    });
    res.json({ message: "Đã đánh dấu tất cả đã đọc" });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMyNotifications, markRead, markAllRead };
