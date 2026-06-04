# BusGo — Nền tảng đặt vé xe khách trực tuyến

Website bán vé xe khách theo mô hình **marketplace** (nhiều nhà xe), tích hợp thanh toán VNPay, AI Chatbot và hệ thống quản trị đầy đủ.

## Tính năng chính

### Khách hàng

- Đăng ký / đăng nhập (email + mật khẩu, Google OAuth), xác thực email, quên mật khẩu
- Tìm chuyến (lọc, sắp xếp, phân trang), xem chi tiết + đánh giá
- Đặt vé, chọn ghế, áp mã giảm giá, thanh toán VNPay
- Vé điện tử có mã QR, lịch sử đặt vé, huỷ vé + hoàn tiền theo chính sách
- Thông báo realtime (SSE), đổi/xoá ảnh đại diện
- AI Chatbot (Claude + Tool Use): tìm chuyến, tra mã giảm giá, xem booking

### Nhà xe (company_admin) & nhân viên (staff)

- Quản lý chuyến, xe, tài xế, đặt vé
- Check-in vé bằng quét mã QR
- Dashboard: doanh thu, booking, hoa hồng đã trả, doanh thu thực nhận
- Xử lý báo cáo, xuất Excel

### Quản trị viên (admin)

- Quản lý người dùng, doanh nghiệp, tuyến đường
- Quản lý mã khuyến mãi (CRUD + điều kiện áp dụng: khách mới, 1 lần/user, số booking tối thiểu)
- Dashboard tổng: doanh thu, hoa hồng platform, biểu đồ theo tháng/năm
- Cài đặt tỉ lệ hoa hồng cho từng nhà xe

### Tự động hoá

- Cron tự huỷ booking quá hạn + trả ghế (mỗi 5 phút)
- Cron đối soát thanh toán pending với VNPay QueryDR (mỗi 2 phút) — chống mất đơn khi IPN miss
- Nhà xe huỷ chuyến → tự hoàn tiền 100% tất cả khách + trả ghế

## Tech Stack

| Layer      | Công nghệ                                                     |
| ---------- | ------------------------------------------------------------- |
| Frontend   | React 19 + Vite + Tailwind CSS v4 + React Router 7 + Recharts |
| Backend    | Node.js + Express 5 + Prisma ORM 5                            |
| Database   | PostgreSQL 15 (Supabase)                                      |
| Auth       | JWT (access 15p + refresh 7 ngày) + Google OAuth              |
| Thanh toán | VNPay Sandbox (pay / refund / querydr)                        |
| Email      | Nodemailer + Gmail SMTP                                       |
| Storage    | Supabase Storage (ảnh tuyến, avatar)                          |
| AI         | Anthropic Claude API + Tool Use                               |

## Cấu trúc thư mục

```
busgo/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Schema + migrations
│   │   └── seed.js
│   ├── scripts/                # Script test + backfill
│   └── src/
│       ├── controllers/        # Logic nghiệp vụ
│       ├── routes/             # Định nghĩa endpoint
│       ├── middlewares/        # auth, role, validate, rate limit, error
│       ├── validators/         # express-validator
│       ├── jobs/               # Cron jobs
│       └── lib/                # prisma, supabase, mailer, notify, sseManager
└── frontend/
    └── src/
        ├── pages/              # Trang
        ├── components/         # Component dùng chung
        └── context/            # AuthContext, ToastContext
```

## Cài đặt local

### Yêu cầu

- Node.js ≥ 18
- PostgreSQL (hoặc tài khoản Supabase)

### Backend

```bash
cd backend
npm install
cp .env.example .env          # điền giá trị thật vào .env
npx prisma migrate dev        # tạo bảng
npm run seed                  # (tuỳ chọn) tạo dữ liệu mẫu
npm run dev                   # chạy ở http://localhost:3001
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env          # điền VITE_API_URL
npm run dev                   # chạy ở http://localhost:5173
```

## Scripts hữu ích (backend)

````bash
node scripts/testCheckin.js          # test API check-in vé
node scripts/testPromo.js            # test CRUD mã giảm giá
node scripts/testAvatar.js           # test upload avatar

## Testing

Test suite dùng **Jest + Supertest**, chạy trên DB PostgreSQL local riêng (`busgo_test`).

```bash
cd backend
# 1. Tạo DB test (pgAdmin hoặc psql): CREATE DATABASE busgo_test;
# 2. Tạo .env.test từ template + điền password local
cp .env.test.example .env.test
# 3. Chạy test (tự migrate DB test)
npm test
````

Phạm vi: Auth (register/login/me), Booking (giữ ghế, áp promo, điều kiện promo), Payment (`finalizePayment` idempotent + tính hoa hồng). 13 test.

## Triển khai (deploy)

| Phần     | Nền tảng đề xuất | Ghi chú                                                            |
| -------- | ---------------- | ------------------------------------------------------------------ |
| Frontend | Vercel           | Set `VITE_API_URL` trỏ về backend; auto HTTPS                      |
| Backend  | Render / Railway | Build: `npm install && npx prisma generate`, Start: `npm start`    |
| Database | Supabase         | Dùng connection pooler cho `DATABASE_URL`, direct cho `DIRECT_URL` |

Lưu ý khi deploy:

- Cập nhật `FRONTEND_URL` (CORS) và `VNP_RETURN_URL` về domain production (HTTPS)
- VNPay production cần IPN URL public + HTTPS; cron QueryDR là lớp dự phòng
- Render free tier ngủ khi idle → cron có thể không chạy; cân nhắc gói always-on

## Lưu ý kỹ thuật

- UUID làm primary key tất cả bảng
- `departureTime` lưu UTC, Việt Nam UTC+7
- Các thao tác quan trọng (đặt vé, thanh toán, hoàn tiền) dùng Prisma `$transaction`
- `commissionAmount` lưu snapshot trên Booking (không tính lại từ rate) để audit chính xác
