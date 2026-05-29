const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/lib/prisma");
const { resetDb, seedUser } = require("./helpers");

beforeAll(async () => {
  await resetDb();
});
afterAll(async () => {
  await prisma.$disconnect();
});

describe("Auth API", () => {
  test("register email mới → 201", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "new@test.com",
      password: "Password123",
      fullName: "Người Mới",
      phone: "0901112223",
    });
    expect(res.status).toBe(201);
    const user = await prisma.user.findUnique({ where: { email: "new@test.com" } });
    expect(user).not.toBeNull();
  });

  test("register email trùng → 400", async () => {
    await seedUser({ email: "dup@test.com" });
    const res = await request(app).post("/api/auth/register").send({
      email: "dup@test.com",
      password: "Password123",
      fullName: "Trùng",
      phone: "0904445556",
    });
    expect(res.status).toBe(400);
  });

  test("login đúng mật khẩu → trả token", async () => {
    await seedUser({ email: "login@test.com", password: "Password123" });
    const res = await request(app).post("/api/auth/login").send({
      email: "login@test.com",
      password: "Password123",
    });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  test("login sai mật khẩu → 400", async () => {
    await seedUser({ email: "wrong@test.com", password: "Password123" });
    const res = await request(app).post("/api/auth/login").send({
      email: "wrong@test.com",
      password: "SAI_MAT_KHAU",
    });
    expect(res.status).toBe(400);
  });

  test("GET /me có token → trả user", async () => {
    await seedUser({ email: "me@test.com", password: "Password123" });
    const login = await request(app).post("/api/auth/login").send({
      email: "me@test.com",
      password: "Password123",
    });
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${login.body.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("me@test.com");
  });

  test("GET /me không token → 401", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });
});
