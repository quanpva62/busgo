const express = require("express");
const cors = require("cors");
const prisma = require("./lib/prisma");

const app = express();
const authRoutes = require("./routes/auth.routes");
// Middleware
app.use(cors()); // cho phep goi api
app.use(express.json()); //cho phep doc json tu request body

// Routes

app.use("/api/auth", authRoutes);

module.exports = app;
