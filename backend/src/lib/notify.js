const prisma = require("./prisma");
const sseManager = require("./sseManager");

// Tạo notification cho 1 user. Fire-and-forget — lỗi không làm fail request chính.
async function notify(userId, type, title, body) {
  try {
    const noti = await prisma.notification.create({
      data: { userId, type, title, body },
    });
    sseManager.sendToUser(userId, noti);
  } catch (err) {
    console.error("Notify failed:", err);
  }
}

// Tạo notification cho nhiều user cùng lúc (vd chuyến bị huỷ -> tất cả khách)
// Dùng Promise.all + create để lấy được record đầy đủ (createMany không return rows)
async function notifyMany(userIds, type, title, body) {
  if (userIds.length === 0) return;
  try {
    const notifications = await Promise.all(
      userIds.map((userId) =>
        prisma.notification.create({
          data: { userId, type, title, body },
        }),
      ),
    );
    notifications.forEach((noti) => sseManager.sendToUser(noti.userId, noti));
  } catch (err) {
    console.error("NotifyMany failed:", err);
  }
}

module.exports = { notify, notifyMany };
