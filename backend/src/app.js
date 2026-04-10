const express = require("express");
const cors = require("cors");

const app = express();
const authRoutes = require("./routes/auth.routes");
const tripRoutes = require("./routes/trip.routes");
const bookingRoutes = require("./routes/booking.routes");
// Middleware
app.use(cors()); // cho phep goi api
app.use(express.json()); //cho phep doc json tu request body

// Routes

app.use("/api/auth", authRoutes);

app.use("/api/trips", tripRoutes);
app.use("/api/bookings", bookingRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ message: "Không tìm thấy tài nguyên" });
});
module.exports = app;
