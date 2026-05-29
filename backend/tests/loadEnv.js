const path = require("path");
// Load .env.test TRƯỚC khi bất kỳ module nào (prisma) được import
require("dotenv").config({ path: path.resolve(__dirname, "../.env.test") });
