const express = require("express");
const cors = require("cors");

const app = express();
const authRoutes = require("./routes/auth.routes");
const tripRoutes = require("./routes/trip.routes");
// Middleware
app.use(cors()); // cho phep goi api
app.use(express.json()); //cho phep doc json tu request body

// Routes

app.use("/api/auth", authRoutes);

app.use("/api/trips", tripRoutes);
module.exports = app;
