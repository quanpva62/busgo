const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/lib/prisma");
const { resetDb, seedUser, seedTrip } = require("./helpers");

async function tokenFor(email) {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email, password: "Password123" });
  return res.body.accessToken;
}

beforeEach(async () => {
  await resetDb();
});
afterAll(async () => {
  await prisma.$disconnect();
});

describe("Booking API", () => {
  test("tạo booking → ghế held, booking pending", async () => {
    await seedUser({ email: "b1@test.com" });
    const token = await tokenFor("b1@test.com");
    const { trip, tripSeats } = await seedTrip({ price: 200000 });

    const res = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        tripId: trip.id,
        seatIds: [tripSeats[0].id],
        passengerName: "Khách A",
        passengerPhone: "0901234567",
      });

    expect(res.status).toBe(201);
    expect(res.body.booking.status).toBe("pending");
    expect(res.body.booking.totalPrice).toBe(200000);

    const seat = await prisma.tripSeat.findUnique({ where: { id: tripSeats[0].id } });
    expect(seat.status).toBe("held");
  });

  test("đặt ghế đã có người giữ → 400", async () => {
    await seedUser({ email: "u1@test.com" });
    await seedUser({ email: "u2@test.com" });
    const token1 = await tokenFor("u1@test.com");
    const token2 = await tokenFor("u2@test.com");
    const { trip, tripSeats } = await seedTrip();

    // user1 giữ ghế trước
    await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${token1}`)
      .send({
        tripId: trip.id,
        seatIds: [tripSeats[0].id],
        passengerName: "A",
        passengerPhone: "0901234567",
      });

    // user2 đặt cùng ghế → fail
    const res = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${token2}`)
      .send({
        tripId: trip.id,
        seatIds: [tripSeats[0].id],
        passengerName: "B",
        passengerPhone: "0907654321",
      });

    expect(res.status).toBe(400);
  });

  test("áp promo hợp lệ → giảm giá đúng", async () => {
    await seedUser({ email: "p1@test.com" });
    const token = await tokenFor("p1@test.com");
    const { trip, tripSeats } = await seedTrip({ price: 200000 });
    await prisma.promotion.create({
      data: {
        code: "GIAM10",
        discountType: "percentage",
        discountValue: 10,
        expiresAt: new Date(Date.now() + 86400000),
        isActive: true,
      },
    });

    const res = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        tripId: trip.id,
        seatIds: [tripSeats[0].id],
        passengerName: "A",
        passengerPhone: "0901234567",
        promoCode: "GIAM10",
      });

    expect(res.status).toBe(201);
    // 200k - 10% = 180k
    expect(res.body.booking.totalPrice).toBe(180000);
    expect(res.body.booking.discountAmount).toBe(20000);
  });

  test("promo firstBookingOnly khi user đã có vé paid → 400", async () => {
    const user = await seedUser({ email: "p2@test.com" });
    const token = await tokenFor("p2@test.com");

    // Seed sẵn 1 booking paid cho user (đã là khách cũ)
    const seed1 = await seedTrip();
    await prisma.booking.create({
      data: {
        userId: user.id,
        tripId: seed1.trip.id,
        status: "paid",
        totalPrice: 100000,
        passengerName: "A",
        passengerPhone: "0901234567",
        pickupAddress: "x",
        dropoffAddress: "y",
        companyId: seed1.company.id,
        expiresAt: new Date(),
      },
    });

    // Promo chỉ cho khách mới
    await prisma.promotion.create({
      data: {
        code: "NEWONLY",
        discountType: "fixed",
        discountValue: 50000,
        expiresAt: new Date(Date.now() + 86400000),
        isActive: true,
        firstBookingOnly: true,
      },
    });

    const seed2 = await seedTrip();
    const res = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        tripId: seed2.trip.id,
        seatIds: [seed2.tripSeats[0].id],
        passengerName: "A",
        passengerPhone: "0901234567",
        promoCode: "NEWONLY",
      });

    expect(res.status).toBe(400);
  });
});
