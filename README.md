# BusGo — Nền tảng đặt vé xe khách trực tuyến

Website bán vé xe khách theo mô hình **marketplace** (nhiều nhà xe), tích hợp thanh toán VNPay, AI Chatbot và hệ thống quản trị đầy đủ.

## Tính năng chính

**Khách hàng**
- Đăng ký / đăng nhập (email + mật khẩu, Google OAuth), xác thực email, quên mật khẩu
- Tìm chuyến (lọc, sắp xếp, phân trang), xem chi tiết + đánh giá
- Đặt vé, chọn ghế, áp mã giảm giá, thanh toán VNPay
- Vé điện tử có mã QR, lịch sử đặt vé, huỷ vé + hoàn tiền theo chính sách
- Thông báo realtime (SSE), đổi / xoá ảnh đại diện
- AI Chatbot (Claude + Tool Use): tìm chuyến, tra mã giảm giá, xem booking

**Nhà xe (company_admin) & nhân viên (staff)**
- Quản lý chuyến, xe, tài xế, đặt vé
- Check-in vé bằng quét mã QR
- Dashboard: doanh thu, booking, hoa hồng, doanh thu thực nhận
- Xử lý báo cáo, xuất Excel

**Quản trị viên (admin)**
- Quản lý người dùng, doanh nghiệp, tuyến đường
- Quản lý mã khuyến mãi (CRUD + điều kiện: khách mới, 1 lần/user, số booking tối thiểu)
- Dashboard tổng: doanh thu, hoa hồng platform, biểu đồ theo tháng/năm

**Tự động hoá**
- Cron tự huỷ booking quá hạn + trả ghế (mỗi 5 phút)
- Cron đối soát thanh toán pending với VNPay QueryDR (mỗi 2 phút)
- Nhà xe huỷ chuyến → tự hoàn tiền 100% tất cả khách

## Tech Stack

| Layer      | Công nghệ |
|------------|-----------|
| Frontend   | React 19 + Vite + Tailwind CSS v4 + React Router 7 + Recharts |
| Backend    | Node.js + Express 5 + Prisma ORM 5 |
| Database   | PostgreSQL 15 (Supabase) |
| Auth       | JWT (access 15p + refresh 7 ngày, httpOnly cookie) + Google OAuth |
| Thanh toán | VNPay Sandbox (pay / refund / querydr) |
| Email      | Nodemailer + Gmail SMTP |
| Storage    | Supabase Storage (ảnh tuyến, avatar) |
| AI         | Anthropic Claude API + Tool Use |

## Cấu trúc thư mục

```
busgo/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # 18 bảng, 14 enum
│   │   └── seed.js
│   ├── src/
│   │   ├── controllers/        # Logic nghiệp vụ
│   │   ├── routes/             # Định nghĩa endpoint
│   │   ├── middlewares/        # auth, role, validate, rate limit, error
│   │   ├── validators/         # express-validator
│   │   ├── jobs/               # Cron jobs
│   │   └── lib/                # prisma, supabase, mailer, notify, sseManager, aiClient
│   └── tests/                  # Jest + Supertest (13 test cases)
└── frontend/
    └── src/
        ├── pages/              # 20 trang
        ├── components/         # Component dùng chung
        └── context/            # AuthContext, ToastContext
```

## Cài đặt local

### Yêu cầu

- Node.js ≥ 18
- PostgreSQL 15 (hoặc tài khoản [Supabase](https://supabase.com))
- Tài khoản [VNPay Sandbox](https://sandbox.vnpayment.vn/devreg)
- [Anthropic API key](https://console.anthropic.com)
- Gmail App Password (để gửi email)

### 1. Clone repo

```bash
git clone https://github.com/quanpva62/busgo.git
cd busgo
```

### 2. Cài đặt Backend

```bash
cd backend
npm install
```

Tạo file `.env` trong thư mục `backend/` với nội dung sau:

```env
# Database (Supabase hoặc PostgreSQL local)
DATABASE_URL="postgresql://user:password@host:5432/busgo?pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:5432/busgo"

# JWT
JWT_SECRET="your-jwt-secret-min-32-chars"
JWT_REFRESH_SECRET="your-refresh-secret-min-32-chars"
JWT_ACCESS_EXPIRES="15m"
JWT_REFRESH_EXPIRES="7d"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"

# Gmail SMTP
MAIL_USER="youremail@gmail.com"
MAIL_PASS="your-gmail-app-password"
MAIL_FROM="BusGo <youremail@gmail.com>"

# VNPay Sandbox
VNP_TMN_CODE="your-vnp-tmn-code"
VNP_HASH_SECRET="your-vnp-hash-secret"
VNP_URL="https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
VNP_QUERY_URL="https://sandbox.vnpayment.vn/merchant_webapi/api/transaction"
VNP_REFUND_URL="https://sandbox.vnpayment.vn/merchant_webapi/api/transaction"
VNP_RETURN_URL="http://localhost:5173/payment/result"

# Anthropic (Claude AI)
ANTHROPIC_API_KEY="sk-ant-..."

# Supabase Storage
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# App
PORT=3001
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"
RUN_CRON="true"
```

Migrate database và seed dữ liệu mẫu:

```bash
npx prisma migrate dev
node prisma/seed.js        # tạo admin + dữ liệu mẫu (tuỳ chọn)
```

Chạy server:

```bash
npm run dev    # http://localhost:3001
```

### 3. Cài đặt Frontend

```bash
cd frontend
npm install
```

Tạo file `.env` trong thư mục `frontend/`:

```env
VITE_API_URL="http://localhost:3001"
VITE_GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
```

Chạy:

```bash
npm run dev    # http://localhost:5173
```

## Testing

Test suite dùng Jest + Supertest, chạy trên DB PostgreSQL riêng.

```bash
# 1. Tạo database test
psql -U postgres -c "CREATE DATABASE busgo_test;"

# 2. Tạo file .env.test trong backend/ (giống .env nhưng đổi DATABASE_URL trỏ về busgo_test)

# 3. Chạy test
cd backend
npm test
```

Phạm vi: Auth (register, login, me), Booking (giữ ghế atomic, áp promo, điều kiện promo), Payment (finalizePayment idempotent + tính hoa hồng). **13 test cases**.

## Triển khai (Production)

| Phần     | Nền tảng   | Ghi chú |
|----------|------------|---------|
| Frontend | Vercel     | Set `VITE_API_URL` trỏ về backend URL |
| Backend  | Render     | Build: `npm install && npx prisma generate` · Start: `npm start` |
| Database | Supabase   | Dùng connection pooler cho `DATABASE_URL`, direct URL cho `DIRECT_URL` |

**Lưu ý khi deploy:**
- Cập nhật `FRONTEND_URL` (CORS) và `VNP_RETURN_URL` về domain HTTPS production
- `RUN_CRON=true` trên Render để bật cron jobs
- Render free tier ngủ khi idle → cron có thể không chạy; cân nhắc gói Starter trở lên

## Lưu ý kỹ thuật

- UUID làm primary key tất cả bảng
- `departureTime` lưu UTC, hiển thị UTC+7
- Các thao tác quan trọng (đặt vé, thanh toán, hoàn tiền) dùng Prisma `$transaction`
- Refresh token lưu dạng SHA-256 hash trong DB, gửi qua httpOnly cookie
- `commissionAmount` lưu snapshot trên Booking (không tính lại từ rate) để audit chính xác
- Ảnh upload qua sharp: resize + chuyển webp trước khi lưu Supabase Storage
