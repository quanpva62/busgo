const prisma = require("../lib/prisma");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const { sendPasswordResetEmail } = require("../lib/mailer");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const PASSWORD_COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

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

const register = async (req, res) => {
  try {
    const { email, password, fullName, phone } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const existingPhone = await prisma.user.findUnique({ where: { phone } });
    if (existingPhone) {
      return res.status(400).json({ error: "Phone number already in use" });
    }
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        fullName,
        phone,
      },
    });
    res.status(201).json({
      message: "Registration successful",
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    if (!user.passwordHash) {
      return res.status(400).json({
        error:
          "This account was registered with Google, please sign in with Google",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: "Account has been disabled" });
    }

    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );

    const refreshToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      message: "Login successful",
      accessToken: accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const me = async (req, res) => {
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
      },
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateMe = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { fullName, phone } = req.body;

    const existing = await prisma.user.findFirst({
      where: { phone, NOT: { id: userId } },
    });
    if (existing) {
      return res.status(400).json({ error: "Phone number already in use" });
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
      },
    });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user.passwordHash) {
      return res
        .status(400)
        .json({ error: "Google account has no password set" });
    }

    if (isWithinCooldown(user.passwordChangedAt)) {
      return res
        .status(429)
        .json({ error: cooldownRemainingMsg(user.passwordChangedAt) });
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash, passwordChangedAt: new Date() },
    });
    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
      if (err) {
        return res
          .status(403)
          .json({ error: "Invalid or expired refresh token" });
      }

      const accessToken = jwt.sign(
        { userId: decoded.userId, role: decoded.role },
        process.env.JWT_SECRET,
        { expiresIn: "15m" },
      );

      res.json({ accessToken });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: "ID token is required" });
    }

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload.email_verified) {
      return res
        .status(400)
        .json({ error: "Google account email is not verified" });
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
      return res.status(403).json({ error: "Account has been disabled" });
    }

    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );
    const refreshToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      message: "Google login successful",
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

const forgotPassword = async (req, res) => {
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
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 phút

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
    res.status(500).json({ error: error.message });
  }
};

const resetPassword = async (req, res) => {
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
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  register,
  login,
  me,
  updateMe,
  changePassword,
  refreshToken,
  googleLogin,
  forgotPassword,
  resetPassword,
};
