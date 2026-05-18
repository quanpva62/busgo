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

module.exports = { authLimit, passwordResetLimit };
