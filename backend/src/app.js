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
const errorHandler = require("./middlewares/error.middleware");
const morgan = require("morgan");
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
// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ message: "Không tìm thấy tài nguyên" });
});
app.use(errorHandler);
module.exports = app;
