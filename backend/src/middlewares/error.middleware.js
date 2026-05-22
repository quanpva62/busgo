function errorHandler(err, req, res, next) {
  console.error(err);

  // Prisma errors (P2002 = unique violation, P2025 = not found, ...)
  if (err.code === "P2002") {
    return res.status(400).json({ error: "Dữ liệu đã tồn tại" });
  }
  if (err.code === "P2025") {
    return res.status(404).json({ error: "Không tìm thấy" });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ error: "Token không hợp lệ" });
  }

  // Custom errors (throw new Error(...) with .status set)
  const status = err.status || 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "Lỗi máy chủ nội bộ"
      : err.message || "Internal error";
  res.status(status).json({ error: message });
}

module.exports = errorHandler;
