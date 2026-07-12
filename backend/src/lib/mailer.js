const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const sendTicketEmail = async ({ to, passengerName, ticketCode, fromCity, toCity, departureTime, seats, totalPrice, companyName }) => {
  const dateStr = new Date(departureTime).toLocaleString("vi-VN", {
    weekday: "long", day: "numeric", month: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });

  await transporter.sendMail({
    from: process.env.MAIL_FROM || `"BusGo" <${process.env.MAIL_USER}>`,
    to,
    subject: `🎫 Vé xe của bạn: ${fromCity} → ${toCity}`,
    html: `
<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);padding:28px 32px;">
      <p style="margin:0;color:#fff;font-size:24px;font-weight:900;letter-spacing:-0.5px;">BusGo</p>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.75);font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">E-Ticket xác nhận</p>
    </div>

    <!-- Greeting -->
    <div style="padding:24px 32px 0;">
      <p style="margin:0;font-size:16px;color:#1e293b;">Xin chào <strong>${passengerName}</strong>,</p>
      <p style="margin:8px 0 0;font-size:14px;color:#64748b;">Đặt vé thành công! Thông tin chuyến đi của bạn bên dưới.</p>
    </div>

    <!-- Route -->
    <div style="margin:20px 32px;background:#f8faff;border-radius:14px;padding:20px;text-align:center;">
      <div style="display:flex;align-items:center;justify-content:center;gap:12px;">
        <div>
          <p style="margin:0;font-size:22px;font-weight:900;color:#1e293b;">${fromCity}</p>
        </div>
        <p style="margin:0;font-size:20px;color:#94a3b8;">→</p>
        <div>
          <p style="margin:0;font-size:22px;font-weight:900;color:#1e293b;">${toCity}</p>
        </div>
      </div>
      <p style="margin:10px 0 0;font-size:13px;color:#64748b;">${dateStr}</p>
    </div>

    <!-- Details -->
    <div style="margin:0 32px;border-top:1px dashed #e2e8f0;border-bottom:1px dashed #e2e8f0;padding:16px 0;">
      <table style="width:100%;border-collapse:collapse;">
        ${companyName ? `<tr>
          <td style="padding:6px 0;font-size:12px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Nhà xe</td>
          <td style="padding:6px 0;font-size:14px;font-weight:700;color:#1e293b;text-align:right;">${companyName}</td>
        </tr>` : ""}
        <tr>
          <td style="padding:6px 0;font-size:12px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Ghế</td>
          <td style="padding:6px 0;font-size:14px;font-weight:700;color:#3b82f6;text-align:right;">${seats}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:12px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Tổng tiền</td>
          <td style="padding:6px 0;font-size:14px;font-weight:700;color:#1e293b;text-align:right;">${Number(totalPrice).toLocaleString("vi-VN")}đ</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:12px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Mã vé</td>
          <td style="padding:6px 0;font-size:14px;font-weight:900;color:#1e293b;text-align:right;font-family:monospace;letter-spacing:2px;">${ticketCode}</td>
        </tr>
      </table>
    </div>

    <!-- Footer -->
    <div style="padding:20px 32px 28px;">
      <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">Vui lòng xuất trình mã vé hoặc QR code khi lên xe.</p>
      <p style="margin:8px 0 0;font-size:12px;color:#cbd5e1;text-align:center;">© 2026 BusGo · Chúc bạn có chuyến đi vui vẻ 🚌</p>
    </div>
  </div>
</body>
</html>
    `,
  });
};

const sendPasswordResetEmail = async ({ to, fullName, resetUrl }) => {
  await transporter.sendMail({
    from: process.env.MAIL_FROM || `"BusGo" <${process.env.MAIL_USER}>`,
    to,
    subject: "🔐 Đặt lại mật khẩu BusGo",
    html: `
<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);padding:28px 32px;">
      <p style="margin:0;color:#fff;font-size:24px;font-weight:900;letter-spacing:-0.5px;">BusGo</p>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.75);font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">Đặt lại mật khẩu</p>
    </div>
    <div style="padding:28px 32px;">
      <p style="margin:0;font-size:16px;color:#1e293b;">Xin chào <strong>${fullName || "bạn"}</strong>,</p>
      <p style="margin:12px 0 0;font-size:14px;color:#64748b;line-height:1.6;">
        Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản BusGo của bạn.
        Nhấn nút dưới đây để tạo mật khẩu mới (link có hiệu lực trong 15 phút):
      </p>
      <div style="text-align:center;margin:28px 0;">
        <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:14px;">
          Đặt lại mật khẩu
        </a>
      </div>
      <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
        Hoặc copy link sau vào trình duyệt:<br/>
        <span style="word-break:break-all;color:#3b82f6;">${resetUrl}</span>
      </p>
      <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;line-height:1.6;">
        Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này. Mật khẩu của bạn vẫn an toàn.
      </p>
    </div>
    <div style="padding:16px 32px 24px;border-top:1px solid #f1f5f9;">
      <p style="margin:0;font-size:11px;color:#cbd5e1;text-align:center;">© 2026 BusGo · Email tự động, không trả lời</p>
    </div>
  </div>
</body>
</html>
    `,
  });
};

const sendVerificationEmail = async ({ to, fullName, verifyUrl }) => {
  await transporter.sendMail({
    from: process.env.MAIL_FROM || `"BusGo" <${process.env.MAIL_USER}>`,
    to,
    subject: "✉️ Xác thực email BusGo",
    html: `
<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);padding:28px 32px;">
      <p style="margin:0;color:#fff;font-size:24px;font-weight:900;letter-spacing:-0.5px;">BusGo</p>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.75);font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">Xác thực Email</p>
    </div>
    <div style="padding:28px 32px;">
      <p style="margin:0;font-size:16px;color:#1e293b;">Chào mừng <strong>${fullName || "bạn"}</strong> đến với BusGo! 🚌</p>
      <p style="margin:12px 0 0;font-size:14px;color:#64748b;line-height:1.6;">
        Vui lòng nhấn nút dưới để xác thực email và kích hoạt tài khoản (link có hiệu lực trong 24 giờ):
      </p>
      <div style="text-align:center;margin:28px 0;">
        <a href="${verifyUrl}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:14px;">
          Xác thực email
        </a>
      </div>
      <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
        Hoặc copy link sau vào trình duyệt:<br/>
        <span style="word-break:break-all;color:#3b82f6;">${verifyUrl}</span>
      </p>
      <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;line-height:1.6;">
        Nếu bạn không đăng ký tài khoản BusGo, hãy bỏ qua email này.
      </p>
    </div>
    <div style="padding:16px 32px 24px;border-top:1px solid #f1f5f9;">
      <p style="margin:0;font-size:11px;color:#cbd5e1;text-align:center;">© 2026 BusGo · Email tự động, không trả lời</p>
    </div>
  </div>
</body>
</html>
    `,
  });
};

module.exports = { sendTicketEmail, sendPasswordResetEmail, sendVerificationEmail };
