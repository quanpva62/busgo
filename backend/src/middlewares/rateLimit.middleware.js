const { rateLimit, ipKeyGenerator } = require("express-rate-limit");

const byEmailOrIp = (req) =>
  req.body?.email?.toLowerCase() || ipKeyGenerator(req.ip);

const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: byEmailOrIp,
  message: {
    error: "Quá nhiều yêu cầu cho tài khoản này, vui lòng thử lại sau 15 phút.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordResetLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: byEmailOrIp,
  message: {
    error:
      "Quá nhiều yêu cầu đặt lại mật khẩu cho tài khoản này, thử lại sau 1 giờ.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limit chung cho mọi API — chống abuse (booking spam, payment URL spam, …)
const apiLimit = rateLimit({
  windowMs: 60 * 1000, // 1 phút
  max: 60, // 60 req/phút/IP
  message: { error: "Quá nhiều yêu cầu, vui lòng thử lại sau ít phút." },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimit, passwordResetLimit, apiLimit };
