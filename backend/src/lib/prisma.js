const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

module.exports = prisma;

//tạo 1 instance Prisma dùng chung cho toàn bộ app
