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

// Limit chung cho mọi API, chống abuse (booking spam, payment URL spam, …)
const apiLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: "Quá nhiều yêu cầu, vui lòng thử lại sau ít phút." },
  standardHeaders: true,
  legacyHeaders: false,
});

const globalLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 200,
  keyGenerator: ipKeyGenerator,
  message: { error: "Quá nhiều yêu cầu, vui lòng thử lại sau ít phút." },
  standardHeaders: true,
  legacyHeaders: false,
});

const byUserOrIp = (req) => req.user?.userId || ipKeyGenerator(req.ip);

const chatbotLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  keyGenerator: byUserOrIp,
  message: { error: "Chatbot đang quá tải, vui lòng thử lại sau ít phút." },
  standardHeaders: true,
  legacyHeaders: false,
});

const refreshLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  keyGenerator: ipKeyGenerator,
  message: {
    error: "Quá nhiều yêu cầu tải lại trang, vui lòng thử lại sau ít phút.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const verifyEmailLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  keyGenerator: ipKeyGenerator,
  message: {
    error: "Quá nhiều yêu cầu xác minh email, vui lòng thử lại sau 15 phút.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  authLimit,
  passwordResetLimit,
  apiLimit,
  globalLimit,
  chatbotLimit,
  refreshLimit,
  verifyEmailLimit,
};
