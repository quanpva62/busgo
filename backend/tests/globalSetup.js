const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env.test") });
const { execSync } = require("child_process");

// Chạy 1 lần trước toàn bộ test suite: áp migrations lên DB test
module.exports = async () => {
  console.log("\n[test] Applying migrations to test DB...");
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: process.env,
  });
};
