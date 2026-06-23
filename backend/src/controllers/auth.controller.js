const prisma = require("../lib/prisma");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const {
  sendPasswordResetEmail,
  sendVerificationEmail,
} = require("../lib/mailer");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const supabase = require("../lib/supabase");
const PASSWORD_COOLDOWN_DAYS = Number(process.env.PASSWORD_COOLDOWN_DAYS) || 3;
const RESET_TOKEN_TTL_MIN = Number(process.env.RESET_TOKEN_TTL_MIN) || 15;
const VERIFY_TOKEN_TTL_HOURS = Number(process.env.VERIFY_TOKEN_TTL_HOURS) || 24;
const JWT_ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || "15m";
const JWT_REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || "7d";
const REFRESH_COOKIE_NAME = "refreshToken";
const PASSWORD_COOLDOWN_MS = PASSWORD_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

function hashToken(raw) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Options cho cookie refresh token — phân biệt prod vs dev:
//   - httpOnly: chặn JS đọc → không bị XSS lấy token
//   - secure: HTTPS only (prod). Dev http không set vì localhost không HTTPS.
//   - sameSite "none" (prod): cho phép cross-site (Vercel→Render khác domain) — bắt buộc khi secure=true
//   - sameSite "lax" (dev): same-origin OK cho dev localhost
//   - path: chỉ /api/auth/* → các endpoint khác KHÔNG nhận cookie này (giảm surface)
function refreshCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/api/auth",
  };
}
function isWithinCooldown(passwordChangedAt) {
  if (!passwordChangedAt) return false;
  return (
    Date.now() - new Date(passwordChangedAt).getTime() < PASSWORD_COOLDOWN_MS
  );
}

function cooldownRemainingMsg(passwordChangedAt) {
  const elapsed = Date.now() - new Date(passwordChangedAt).getTime();
  const remainingHours = Math.ceil(
    (PASSWORD_COOLDOWN_MS - elapsed) / (60 * 60 * 1000),
  );
  return `Mật khẩu mới được đổi gần đây. Vui lòng thử lại sau ${remainingHours} giờ.`;
}

const register = async (req, res, next) => {
  try {
    const { email, password, fullName, phone } = req.body;

    // 1. Check duplicate
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email đã được sử dụng" });
    }
    const existingPhone = await prisma.user.findUnique({ where: { phone } });
    if (existingPhone) {
      return res.status(400).json({ error: "Số điện thoại đã được sử dụng" });
    }

    // 2. Tạo user + verify token cùng lúc
    const hashedPassword = await bcrypt.hash(password, 10);
    const verifyToken = crypto.randomBytes(32).toString("hex");
    const hashedVerifyToken = crypto
      .createHash("sha256")
      .update(verifyToken)
      .digest("hex");
    const verifyExpires = new Date(
      Date.now() + VERIFY_TOKEN_TTL_HOURS * 60 * 60 * 1000,
    ); // 24h

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        fullName,
        phone,
        emailVerifyToken: hashedVerifyToken,
        emailVerifyExpires: verifyExpires,
      },
    });

    // 3. Gửi email verify (không block register nếu Gmail lỗi — user có thể resend)
    const verifyUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/verify-email?token=${verifyToken}`;
    try {
      await sendVerificationEmail({
        to: user.email,
        fullName: user.fullName,
        verifyUrl,
      });
    } catch (mailErr) {
      // Cố ý nuốt lỗi — register vẫn thành công, user dùng resend nếu cần
      console.error("Send verification email failed:", mailErr);
    }

    res.status(201).json({
      message:
        "Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.",
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
      },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const isEmail = email.includes("@");
    const user = await prisma.user.findUnique({
      where: isEmail ? { email } : { phone: email },
    });
    if (!user) {
      return res
        .status(400)
        .json({ error: "Tài khoản hoặc mật khẩu không đúng" });
    }

    if (!user.passwordHash) {
      return res.status(400).json({
        error:
          "Tài khoản này đăng ký bằng Google, vui lòng đăng nhập bằng Google",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Email hoặc mật khẩu không đúng" });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        error:
          "Email chưa được xác thực. Vui lòng kiểm tra hộp thư và xác thực email.",
        needVerification: true,
      });
    }
    if (!user.isActive) {
      return res.status(403).json({ error: "Tài khoản đã bị khoá" });
    }

    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: JWT_ACCESS_EXPIRES },
    );

    const refreshTokenJwt = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRES },
    );

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshTokenJwt),
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
        userAgent: req.headers["user-agent"] || "unknown",
        ip: req.ip || null,
      },
    });

    // Set refresh token vào httpOnly cookie thay vì trả về body
    // → JS frontend không đọc được → an toàn trước XSS
    res.cookie(REFRESH_COOKIE_NAME, refreshTokenJwt, refreshCookieOptions());

    res.json({
      message: "Đăng nhập thành công",
      accessToken,
      // KHÔNG trả refreshToken trong body — browser tự lưu cookie
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await prisma.user.findUnique({
      where: { emailVerifyToken: hashedToken },
    });

    if (
      !user ||
      !user.emailVerifyExpires ||
      user.emailVerifyExpires < new Date()
    ) {
      return res
        .status(400)
        .json({ error: "Token không hợp lệ hoặc đã hết hạn" });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifyToken: null,
        emailVerifyExpires: null,
      },
    });
    res.json({
      message: "Xác thực Email thành công! Bạn có thể đăng nhập ngay bây giờ.",
    });
  } catch (error) {
    next(error);
  }
};

const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    // Không tiết lộ email có tồn tại + đã verified hay chưa
    const genericMsg =
      "Nếu email tồn tại và chưa xác thực, link mới đã được gửi.";
    if (!user || user.emailVerified) {
      return res.json({ message: genericMsg });
    }

    const verifyToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(verifyToken)
      .digest("hex");
    const verifyExpires = new Date(
      Date.now() + VERIFY_TOKEN_TTL_HOURS * 60 * 60 * 1000,
    );

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifyToken: hashedToken,
        emailVerifyExpires: verifyExpires,
      },
    });

    const verifyUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/verify-email?token=${verifyToken}`;
    await sendVerificationEmail({
      to: user.email,
      fullName: user.fullName,
      verifyUrl,
    });

    res.json({ message: genericMsg });
  } catch (error) {
    next(error);
  }
};

const me = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        avatarUrl: true,
      },
    });
    if (!user) {
      return res.status(404).json({ error: "Không tìm thấy người dùng" });
    }
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

const updateMe = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { fullName, phone } = req.body;

    const existing = await prisma.user.findFirst({
      where: { phone, NOT: { id: userId } },
    });
    if (existing) {
      return res.status(400).json({ error: "Số điện thoại đã được sử dụng" });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { fullName, phone },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        avatarUrl: true,
      },
    });
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user.passwordHash) {
      return res
        .status(400)
        .json({ error: "Tài khoản Google chưa cài mật khẩu" });
    }

    if (isWithinCooldown(user.passwordChangedAt)) {
      return res
        .status(429)
        .json({ error: cooldownRemainingMsg(user.passwordChangedAt) });
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return res.status(400).json({ error: "Mật khẩu hiện tại không đúng" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash, passwordChangedAt: new Date() },
    });
    res.json({ message: "Đổi mật khẩu thành công" });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const rawToken = req.cookies[REFRESH_COOKIE_NAME];
    if (!rawToken) return res.status(400).json({ error: "Chưa đăng nhập!" });

    // 1. Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(rawToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(403).json({ error: "Refresh token không hợp lệ" });
    }

    // 2. Check DB
    const tokenHash = hashToken(rawToken);
    const record = await prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
    if (!record || record.revokedAt || record.expiresAt < new Date()) {
      return res
        .status(403)
        .json({ error: "Refresh token không hợp lệ hoặc đã hết hạn" });
    }

    // 3. Đọc lại user từ DB — không tin role/trạng thái đóng băng trong token cũ.
    //    Nếu bị khoá hoặc xoá → revoke token hiện tại, từ chối refresh.
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, isActive: true },
    });
    if (!user || !user.isActive) {
      await prisma.refreshToken.update({
        where: { id: record.id },
        data: { revokedAt: new Date() },
      });
      return res.status(403).json({ error: "Tài khoản không hợp lệ hoặc đã bị khoá" });
    }

    // 4. Rotate: revoke current + issue new (role lấy từ DB, không từ token cũ)
    const newAccessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: JWT_ACCESS_EXPIRES },
    );
    const newRefreshToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRES },
    );
    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: record.id },
        data: {
          revokedAt: new Date(),
        },
      }),
      prisma.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(newRefreshToken),
          expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
          userAgent: req.headers["user-agent"] || null,
          ip: req.ip || null,
        },
      }),
    ]);
    // Rotation: cookie cũ bị overwrite bằng cookie mới (same name + path)
    res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, refreshCookieOptions());

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    next(error);
  }
};

const googleLogin = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: "Vui lòng cung cấp ID token" });
    }

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload.email_verified) {
      return res.status(400).json({ error: "Email Google chưa được xác thực" });
    }

    let user = await prisma.user.findUnique({
      where: { googleId: payload.sub },
    });

    if (!user) {
      user = await prisma.user.findUnique({ where: { email: payload.email } });
      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId: payload.sub, emailVerified: true },
        });
      }
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: payload.email,
          fullName: payload.name,
          googleId: payload.sub,
          emailVerified: true,
        },
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: "Tài khoản đã bị khoá" });
    }

    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: JWT_ACCESS_EXPIRES },
    );
    const refreshTokenJwt = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRES },
    );

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshTokenJwt),
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
        userAgent: req.headers["user-agent"] || "unknown",
        ip: req.ip || null,
      },
    });

    res.cookie(REFRESH_COOKIE_NAME, refreshTokenJwt, refreshCookieOptions());

    res.json({
      message: "Đăng nhập Google thành công",
      accessToken,
      // refresh đã ở cookie
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    // Luôn trả 200 thành công kể cả khi email không tồn tại,
    // để tránh attacker dò xem email nào có trong DB.
    if (!user) {
      return res.json({
        message: "Nếu email tồn tại, link đặt lại đã được gửi.",
      });
    }

    if (!user.passwordHash) {
      return res.status(400).json({
        error: "Tài khoản này đăng ký bằng Google, không thể đặt lại mật khẩu",
      });
    }

    if (isWithinCooldown(user.passwordChangedAt)) {
      return res
        .status(429)
        .json({ error: cooldownRemainingMsg(user.passwordChangedAt) });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + RESET_TOKEN_TTL_MIN * 60 * 1000); // 15 phút

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: expires,
      },
    });

    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${token}`;
    await sendPasswordResetEmail({
      to: user.email,
      fullName: user.fullName,
      resetUrl,
    });

    res.json({ message: "Nếu email tồn tại, link đặt lại đã được gửi." });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await prisma.user.findUnique({
      where: { resetPasswordToken: hashedToken },
    });
    if (
      !user ||
      !user.resetPasswordExpires ||
      user.resetPasswordExpires < new Date()
    ) {
      return res
        .status(400)
        .json({ error: "Token không hợp lệ hoặc đã hết hạn" });
    }

    if (isWithinCooldown(user.passwordChangedAt)) {
      return res
        .status(429)
        .json({ error: cooldownRemainingMsg(user.passwordChangedAt) });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordChangedAt: new Date(),
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    res.json({ message: "Đặt lại mật khẩu thành công. Vui lòng đăng nhập." });
  } catch (error) {
    next(error);
  }
};

const ALLOWED_IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp"];

const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file)
      return res.status(400).json({ error: "Vui lòng chọn file ảnh" });

    const { fileTypeFromBuffer } = await import("file-type");
    const detected = await fileTypeFromBuffer(req.file.buffer);
    if (!detected || !ALLOWED_IMAGE_MIMES.includes(detected.mime)) {
      return res.status(400).json({
        error: "File không hợp lệ. Vui lòng chọn ảnh JPEG, PNG hoặc WEBP.",
      });
    }
    const userId = req.user.userId;
    const fileName = `${userId}.${detected.ext}`;
    const { error } = await supabase.storage
      .from("avatars")
      .upload(fileName, req.file.buffer, {
        contentType: detected.mime,
        upsert: true,
      });
    if (error) return res.status(500).json({ error: error.message });

    const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
    const avatarUrl = `${data.publicUrl}?t=${Date.now()}`;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        avatarUrl: true,
      },
    });
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

const removeAvatar = async (req, res, next) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: { avatarUrl: null },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        avatarUrl: true,
      },
    });
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const rawToken = req.cookies[REFRESH_COOKIE_NAME];
    // Cho phép logout kể cả không có rawToken (vd FE đã mất token) — chỉ cần clear FE
    if (rawToken) {
      const tokenHash = hashToken(rawToken);
      await prisma.refreshToken.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions());
    res.json({ message: "Đăng xuất thành công" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  me,
  updateMe,
  changePassword,
  refreshToken,
  verifyEmail,
  resendVerification,
  googleLogin,
  forgotPassword,
  resetPassword,
  uploadAvatar,
  removeAvatar,
};
