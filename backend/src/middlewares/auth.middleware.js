const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Chưa đăng nhập!" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Chưa đăng nhập!" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Token không hợp lệ!" });
    }
    if (!decoded || !decoded.userId) {
      return res.status(403).json({ error: "Token không hợp lệ!" });
    }
    req.user = decoded;
    next();
  });
};

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return next();

  const token = authHeader.split(" ")[1];
  if (!token) return next();

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (!err && decoded?.userId) req.user = decoded;
    next();
  });
};

// Auth cho SSE — đọc token từ query vì EventSource không gửi được header
const sseAuth = (req, res, next) => {
  const token = req.query.token;
  if (!token) return res.status(401).end();
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err || !decoded?.userId) return res.status(403).end();
    req.user = decoded;
    next();
  });
};

authMiddleware.optionalAuth = optionalAuth;
authMiddleware.sseAuth = sseAuth;
module.exports = authMiddleware;
