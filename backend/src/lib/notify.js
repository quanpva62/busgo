const prisma = require("./prisma");

// Tạo notification cho 1 user. Fire-and-forget — lỗi không làm fail request chính.
async function notify(userId, type, title, body) {
  try {
    await prisma.notification.create({
      data: { userId, type, title, body },
    });
  } catch (err) {
    console.error("Notify failed:", err);
  }
}

// Tạo notification cho nhiều user cùng lúc (vd chuyến bị huỷ → tất cả khách)
async function notifyMany(userIds, type, title, body) {
  if (userIds.length === 0) return;
  try {
    await prisma.notification.createMany({
      data: userIds.map((userId) => ({ userId, type, title, body })),
    });
  } catch (err) {
    console.error("NotifyMany failed:", err);
  }
}

module.exports = { notify, notifyMany };
