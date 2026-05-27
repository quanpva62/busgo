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

async function call(method, path, token, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function run() {
  console.log("\n=== Promo CRUD test ===\n");

  const admin = await prisma.user.findFirst({ where: { role: "admin" } });
  const normalUser = await prisma.user.findFirst({ where: { role: "user" } });
  if (!admin) {
    console.log("❌ Không có admin user");
    process.exit(1);
  }
  const adminToken = sign(admin);
  const userToken = normalUser ? sign(normalUser) : null;

  // Cleanup: xoá promo test cũ nếu còn
  await prisma.promotion.deleteMany({ where: { code: { startsWith: "TEST_" } } });

  const validPromo = {
    code: "TEST_PROMO1",
    discountType: "percentage",
    discountValue: 10,
    expiresAt: "2027-12-31",
    minPrice: 100000,
    maxUses: 50,
    firstBookingOnly: true,
    oncePerUser: true,
  };

  // ── 1. Create OK
  const r1 = await call("POST", "/api/promos", adminToken, validPromo);
  const promoId = r1.data.promo?.id;
  console.log(`[1] create valid → ${r1.status === 201 && promoId ? "✅" : "❌"} ${r1.status}`);

  // ── 2. Duplicate code → 400
  const r2 = await call("POST", "/api/promos", adminToken, validPromo);
  console.log(`[2] duplicate code → ${r2.status === 400 ? "✅" : "❌"} ${r2.status} ${r2.data.error ?? ""}`);

  // ── 3. percentage > 100 → 400
  const r3 = await call("POST", "/api/promos", adminToken, { ...validPromo, code: "TEST_BAD1", discountValue: 150 });
  console.log(`[3] percentage > 100 → ${r3.status === 400 ? "✅" : "❌"} ${r3.status}`);

  // ── 4. expiresAt past → 400
  const r4 = await call("POST", "/api/promos", adminToken, { ...validPromo, code: "TEST_BAD2", expiresAt: "2020-01-01" });
  console.log(`[4] expiresAt past → ${r4.status === 400 ? "✅" : "❌"} ${r4.status}`);

  // ── 5. Normal user create → 403
  if (userToken) {
    const r5 = await call("POST", "/api/promos", userToken, validPromo);
    console.log(`[5] non-admin create → ${r5.status === 403 ? "✅" : "❌"} ${r5.status}`);
  }

  // ── 6. List
  const r6 = await call("GET", "/api/promos?page=1&limit=5", adminToken);
  console.log(`[6] list → ${r6.status === 200 && Array.isArray(r6.data.promos) ? "✅" : "❌"} ${r6.status} (${r6.data.total} total)`);

  // ── 7. Update OK (PATCH)
  const r7 = await call("PATCH", `/api/promos/${promoId}`, adminToken, { discountValue: 20 });
  console.log(`[7] update OK → ${r7.status === 200 && r7.data.promo?.discountValue === 20 ? "✅" : "❌"} ${r7.status}`);

  // ── 8. Update not found → 404
  const r8 = await call("PATCH", "/api/promos/00000000-0000-0000-0000-000000000000", adminToken, { discountValue: 30 });
  console.log(`[8] update not found → ${r8.status === 404 ? "✅" : "❌"} ${r8.status}`);

  // ── 9. Public /active (no auth)
  const r9 = await call("GET", "/api/promos/active");
  const hasOurPromo = r9.data.promos?.some((p) => p.id === promoId);
  console.log(`[9] public active → ${r9.status === 200 && hasOurPromo ? "✅" : "❌"} ${r9.status}`);

  // ── 10. Delete (chưa có booking dùng) → 200
  const r10 = await call("DELETE", `/api/promos/${promoId}`, adminToken);
  console.log(`[10] delete unused → ${r10.status === 200 ? "✅" : "❌"} ${r10.status}`);

  // ── 11. Delete not found → 404
  const r11 = await call("DELETE", `/api/promos/${promoId}`, adminToken);
  console.log(`[11] delete twice → ${r11.status === 404 ? "✅" : "❌"} ${r11.status}`);

  await prisma.$disconnect();
}

run().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
