const express = require("express");
const cors = require("cors");

const app = express();
const authRoutes = require("./routes/auth.routes");
const tripRoutes = require("./routes/trip.routes");
const bookingRoutes = require("./routes/booking.routes");
const paymentRoutes = require("./routes/payment.routes");
const ticketRoutes = require("./routes/ticket.routes");
const reportRoutes = require("./routes/report.routes");
const adminRoutes = require("./routes/admin.routes");
const chatbotRoutes = require("./routes/chatbot.routes");
const reviewRoutes = require("./routes/review.routes");
const notificationRoutes = require("./routes/notification.routes");
const promoRoutes = require("./routes/promo.routes");
const errorHandler = require("./middlewares/error.middleware");
const morgan = require("morgan");
const cron = require("node-cron");
const releaseExpiredBookings = require("./jobs/releaseExpiredBookings");
const { reconcilePendingPayments } = require("./jobs/reconcilePendingPayments");

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
  }),
);
// cho phep goi api
app.use(express.json()); //cho phep doc json tu request body

app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/promos", promoRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ message: "Không tìm thấy tài nguyên" });
});
if (process.env.NODE_ENV !== "test") {
  cron.schedule("*/5 * * * *", () => {
    releaseExpiredBookings().catch((e) =>
      console.error("[cron] Release expired bookings failed:", e),
    );
  });
  cron.schedule("*/2 * * * *", () => {
    reconcilePendingPayments().catch((e) =>
      console.error("[cron] Reconcile pending payments failed:", e),
    );
  });
}
app.use(errorHandler);
module.exports = app;
