module.exports = {
  testEnvironment: "node",
  // loadEnv chạy trước khi import module → Prisma đọc đúng DATABASE_URL test
  setupFiles: ["<rootDir>/tests/loadEnv.js"],
  // globalSetup chạy 1 lần: migrate DB test
  globalSetup: "<rootDir>/tests/globalSetup.js",
  testMatch: ["**/tests/**/*.test.js"],
  testTimeout: 30000,
  // Chạy tuần tự — tránh các test file ghi đè data của nhau
  maxWorkers: 1,
};
