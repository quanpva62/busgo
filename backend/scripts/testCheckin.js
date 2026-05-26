require("dotenv").config();
const jwt = require("jsonwebtoken");
const prisma = require("../src/lib/prisma");

const API = `http://localhost:${process.env.PORT || 3001}`;

function sign(user) {
  return jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );
}

async function call(token, qrCode) {
  const res = await fetch(`${API}/api/tickets/checkin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ qrCode }),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function run() {
  console.log("\n=== Check-in API test ===\n");

  // 1. Tìm 1 ticket paid (bất kỳ); reset isUsed về false trước khi test
  const ticket = await prisma.ticket.findFirst({
    where: { booking: { status: "paid" } },
    include: { booking: { include: { trip: { include: { bus: true } } } } },
  });
  if (!ticket) {
    console.log("❌ Không có ticket paid nào trong DB để test");
    process.exit(1);
  }
  const originalUsed = ticket.isUsed;
  const originalUsedAt = ticket.usedAt;
  if (originalUsed) {
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { isUsed: false, usedAt: null },
    });
    ticket.isUsed = false;
  }
  const companyId = ticket.booking.trip.bus.companyId;
  console.log(`Ticket: ${ticket.id.slice(0, 8)}... | company: ${companyId.slice(0, 8)}...`);

  // 2. Tìm 1 user company_admin của đúng company
  const rightStaff = await prisma.user.findFirst({
    where: { role: "company_admin", companyId },
  });
  if (!rightStaff) {
    console.log("❌ Không có company_admin của company này");
    process.exit(1);
  }

  // 3. Tìm 1 user role=user (để test 403)
  const normalUser = await prisma.user.findFirst({ where: { role: "user" } });

  // 4. Tìm 1 company_admin của company khác (test wrong company)
  const wrongStaff = await prisma.user.findFirst({
    where: { role: "company_admin", companyId: { not: companyId } },
  });

  // ── Test 1: normal user → 403
  if (normalUser) {
    const r = await call(sign(normalUser), ticket.qrCode);
    console.log(`[1] role=user → ${r.status === 403 ? "✅" : "❌"} ${r.status} ${JSON.stringify(r.data)}`);
  }

  // ── Test 2: wrong company → 403
  if (wrongStaff) {
    const r = await call(sign(wrongStaff), ticket.qrCode);
    console.log(`[2] wrong company → ${r.status === 403 ? "✅" : "❌"} ${r.status} ${JSON.stringify(r.data).slice(0, 100)}`);
  }

  // ── Test 3: QR sai → 404
  const r3 = await call(sign(rightStaff), "INVALID_QR_xxx");
  console.log(`[3] invalid QR → ${r3.status === 404 ? "✅" : "❌"} ${r3.status} ${JSON.stringify(r3.data)}`);

  // ── Test 4: thiếu QR → 400
  const r4 = await call(sign(rightStaff), "");
  console.log(`[4] missing QR → ${r4.status === 400 ? "✅" : "❌"} ${r4.status} ${JSON.stringify(r4.data)}`);

  // ── Test 5: checkin lần đầu → 200
  const r5 = await call(sign(rightStaff), ticket.qrCode);
  console.log(`[5] first checkin → ${r5.status === 200 ? "✅" : "❌"} ${r5.status} ${r5.data.message ?? JSON.stringify(r5.data).slice(0, 100)}`);

  // ── Test 6: checkin lần 2 → 400
  const r6 = await call(sign(rightStaff), ticket.qrCode);
  console.log(`[6] re-checkin → ${r6.status === 400 ? "✅" : "❌"} ${r6.status} ${r6.data.error ?? ""}`);

  // ── Restore ticket về trạng thái ban đầu
  await prisma.ticket.update({
    where: { id: ticket.id },
    data: { isUsed: originalUsed, usedAt: originalUsedAt },
  });
  console.log(`\n↩️  Đã restore ticket về trạng thái ban đầu (isUsed=${originalUsed})`);

  await prisma.$disconnect();
}

run().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
