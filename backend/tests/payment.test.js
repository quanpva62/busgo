const prisma = require("../src/lib/prisma");
const { finalizePayment } = require("../src/controllers/payment.controller");
const { resetDb, seedUser, seedTrip } = require("./helpers");

// Helper: tạo booking pending + payment pending sẵn sàng để finalize
async function seedPendingPayment({ price = 200000, commissionRate = 0.1 } = {}) {
  const user = await seedUser();
  const { trip, tripSeats, company } = await seedTrip({ price, commissionRate });

  const booking = await prisma.booking.create({
    data: {
      userId: user.id,
      tripId: trip.id,
      status: "pending",
      totalPrice: price,
      passengerName: "Khách Test",
      passengerPhone: "0901234567",
      pickupAddress: "x",
      dropoffAddress: "y",
      companyId: company.id,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
  });
  await prisma.tripSeat.update({
    where: { id: tripSeats[0].id },
    data: { status: "held", bookingId: booking.id },
  });
  const payment = await prisma.payment.create({
    data: {
      bookingId: booking.id,
      vnpTxnRef: `${booking.id}-${Date.now()}`,
      amount: price,
      status: "pending",
      paymentMethod: "vnpay",
      vnpRaw: {},
    },
  });
  return { booking, payment, tripSeats };
}

beforeEach(async () => {
  await resetDb();
});
afterAll(async () => {
  await prisma.$disconnect();
});

describe("finalizePayment", () => {
  test("chốt đơn → booking paid + ticket + commission đúng", async () => {
    const { booking, payment, tripSeats } = await seedPendingPayment({
      price: 200000,
      commissionRate: 0.1,
    });

    const ok = await finalizePayment(payment, {});
    expect(ok).toBe(true);

    const updated = await prisma.booking.findUnique({ where: { id: booking.id } });
    expect(updated.status).toBe("paid");
    expect(updated.commissionAmount).toBe(20000); // 200k × 10%

    const ticket = await prisma.ticket.findUnique({ where: { bookingId: booking.id } });
    expect(ticket).not.toBeNull();

    const seat = await prisma.tripSeat.findUnique({ where: { id: tripSeats[0].id } });
    expect(seat.status).toBe("booked");

    const pay = await prisma.payment.findUnique({ where: { id: payment.id } });
    expect(pay.status).toBe("successful");
  });

  test("idempotent: gọi lần 2 → return false, không tạo ticket thứ 2", async () => {
    const { booking, payment } = await seedPendingPayment();

    await finalizePayment(payment, {});
    // payment object cũ vẫn status pending trong biến → reload để giống thực tế
    const fresh = await prisma.payment.findUnique({ where: { id: payment.id } });
    const second = await finalizePayment(fresh, {});

    expect(second).toBe(false);

    const tickets = await prisma.ticket.findMany({ where: { bookingId: booking.id } });
    expect(tickets.length).toBe(1);
  });

  test("commission = totalPrice × rate (rate khác)", async () => {
    const { booking, payment } = await seedPendingPayment({
      price: 500000,
      commissionRate: 0.15,
    });
    await finalizePayment(payment, {});
    const updated = await prisma.booking.findUnique({ where: { id: booking.id } });
    expect(updated.commissionAmount).toBe(75000); // 500k × 15%
  });
});
