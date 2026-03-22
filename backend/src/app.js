const express = require("express");
const cors = require("cors");
const prisma = require("./lib/prisma");

const app = express();

// Middleware
app.use(cors()); // cho phep goi api
app.use(express.json()); //cho phep doc json tu request body

// Routes

app.get("/test-db", async (req, res) => {
  try {
    const userCount = await prisma.user.count();
    res.json({ message: "DB connected!", userCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = app;
