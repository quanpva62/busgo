# BÁO CÁO TIẾN ĐỘ ĐỒ ÁN

**Đề tài:** Xây dựng website bán vé xe khách trực tuyến BusGo
**Sinh viên thực hiện:** Phạm Quân
**Ngày báo cáo:** 03/06/2026
**Tỷ lệ hoàn thành ước tính:** ~90%

---

## 1. Tổng quan dự án

BusGo là website đặt vé xe khách trực tuyến theo mô hình **marketplace nhiều nhà xe**, tích hợp thanh toán VNPay và AI Chatbot. Hệ thống phục vụ 4 nhóm người dùng:

- **Khách hàng:** tìm chuyến, đặt vé, thanh toán, hủy vé, đánh giá
- **Nhân viên check-in (staff):** quét QR lên xe
- **Quản trị nhà xe (company_admin):** quản lý xe – tuyến – chuyến – tài xế của công ty mình
- **Quản trị hệ thống (admin):** quản lý toàn bộ marketplace, hoa hồng, đối soát

## 2. Công nghệ sử dụng

### Backend
- **Node.js + Express.js 5** — REST API
- **Prisma ORM 5.22 + PostgreSQL 15** (Supabase) — database
- **JWT** (Access 15p + Refresh 7 ngày lưu DB, httpOnly cookie)
- **VNPay Sandbox** — thanh toán + hoàn tiền
- **Nodemailer + Gmail SMTP** — email xác thực, vé điện tử
- **Anthropic Claude API + Google Gemini API** — Chatbot multi-provider
- **Sentry** — error monitoring production
- **Jest + Supertest** — unit/integration test

### Frontend
- **React 19 + Vite 5** — SPA
- **Tailwind CSS v4** — Material Design 3 system
- **React Router 6** với lazy load + code splitting
- **Lucide Icons** — icon system

### DevOps
- **Vercel** (frontend) + **Render** (backend) + **Supabase** (database)
- **GitHub Actions / Vercel CI** — auto deploy

## 3. Các module đã hoàn thành

### 3.1. Xác thực và bảo mật (Auth)
- Đăng ký, đăng nhập (email/SĐT + Google OAuth)
- Xác thực email qua link, gửi lại email
- Quên mật khẩu — reset qua email
- Refresh token rotation, lưu DB (SHA-256 hash), thu hồi khi đăng xuất
- HttpOnly Cookie cho refresh token (chống XSS)
- Rate limiting nhiều tầng: global, login, register, chatbot, refresh, verify

### 3.2. Tìm chuyến và đặt vé
- Tìm theo điểm đi/đến/ngày, lọc theo nhà xe – loại xe – giờ – giá – tiện ích
- Sắp xếp đa tiêu chí, phân trang
- Sơ đồ ghế tương tác, chọn nhiều ghế cùng lúc
- Tự giữ ghế 15 phút (cron tự release nếu hết hạn)
- Hỗ trợ guest checkout (đặt không cần đăng nhập)
- Áp mã khuyến mãi với rule targeting (ngày/tuyến/nhà xe/người dùng mới)

### 3.3. Thanh toán VNPay
- Tích hợp VNPay Sandbox: tạo giao dịch, return URL, HMAC SHA512
- Đối soát giao dịch lỗi (QueryDR) qua **cron 2 phút** — xử lý trường hợp mất IPN
- Idempotency chống duplicate IPN
- Hoàn tiền (Refund API) khi user huỷ vé hoặc nhà xe huỷ chuyến
- Chính sách hoàn vé theo thời gian: 100% (>24h) / 50% (12-24h) / 0% (<12h)
- Theo dõi hoa hồng nền tảng (commission tracking) trên từng booking
- Đảo hoa hồng khi refund

### 3.4. Vé điện tử và check-in
- Sinh vé QR sau khi thanh toán thành công (mã UUID không đoán được)
- Gửi vé qua email (HTML template)
- Trang check-in cho staff/nhà xe: quét QR bằng camera
- Phân quyền: staff chỉ check-in vé thuộc công ty mình
- Idempotency: vé đã sử dụng → từ chối

### 3.5. AI Chatbot — Multi-provider
- Hỗ trợ **2 mô hình AI**: Claude Sonnet 4.6 và Gemini 2.5 Flash
- User có thể chọn mô hình từ UI (dropdown), lưu lựa chọn vào localStorage
- **6 tools (function calling):** tìm chuyến, chi tiết chuyến, ghế trống, tuyến phổ biến, kiểm tra mã khuyến mãi, lịch sử booking
- Tự động **fallback** sang Claude khi Gemini quá tải (503/429)
- Chuẩn hoá tên thành phố (NFD + strip dấu) để tool match đúng dù AI viết "TPHCM", "Sài Gòn", "tp.hcm"...
- Đặt câu hỏi → AI gợi ý chuyến → click link mở trực tiếp trang booking

### 3.6. Admin Panel
- **Dashboard:** doanh thu theo ngày/tuần/tháng, biểu đồ realtime
- **CRUD đầy đủ:** Users, Companies, Buses, Routes, Trips, Drivers, Promotions
- **Phân quyền 2 lớp:**
  - `admin`: toàn bộ marketplace + hoa hồng
  - `company_admin`: chỉ dữ liệu công ty mình (chart, booking, doanh thu)
- **Quản lý booking:** lọc/tìm, huỷ chuyến hàng loạt (auto refund)
- **Xuất Excel** report bookings, doanh thu
- **Thông báo realtime SSE** (Server-Sent Events) cho admin

### 3.7. Thông báo
- Notification Bell trên header với badge unread count
- Realtime push qua SSE khi booking mới, vé check-in, đánh giá mới
- Email vé + email refund

### 3.8. Đánh giá
- Khách đã đi chuyến mới được đánh giá (1 vé / 1 review)
- Hiển thị rating trung bình trên trang nhà xe, chuyến
- Admin có thể duyệt / ẩn review không phù hợp

### 3.9. Bảo mật và chất lượng code
- HTTPS + CORS đa origin (Vercel + dev)
- HttpOnly + Secure + SameSite cookie cho refresh token
- bcrypt cho password (12 round)
- Helmet + global rate limit
- Validation: express-validator cho mọi input
- Vô hiệu hoá thay vì xoá cứng (soft disable cho company, user)
- Indexes Prisma cho các query nóng
- Error middleware tập trung
- Sentry tracking lỗi production
- Cookie consent banner (GDPR-friendly)
- SEO: meta tags + Open Graph + Twitter Card

### 3.10. Test
- Jest + Supertest suite cho auth, booking, payment flows
- Test happy path + edge cases (sai mật khẩu, ghế đã đặt, refund quá hạn…)

## 4. Số liệu kỹ thuật

| Hạng mục | Con số |
|---|---|
| Backend controllers | 12 |
| Frontend pages | 20 |
| Bảng database | 17 |
| Migration đã chạy | 15+ |
| Endpoint API | 60+ |
| Cron jobs | 2 (release ghế, đối soát thanh toán) |
| Commit chính | 40+ |

## 5. Kiến trúc nổi bật

### 5.1. Refresh token bảo mật
Refresh token được lưu **httpOnly cookie** (chống XSS) + hash SHA-256 trong DB (chống leak DB). Mỗi lần refresh sẽ **xoay token mới** (rotation pattern), token cũ bị thu hồi. Khi logout, token bị đánh dấu `revokedAt`.

### 5.2. Đối soát thanh toán
Production thường gặp tình huống user thanh toán xong rồi đóng trình duyệt → return URL không chạy → booking kẹt pending. BusGo có **cron 2 phút** gọi VNPay QueryDR API hỏi trạng thái thực để chốt đơn.

### 5.3. Multi-AI provider abstraction
Layer `aiClient.js` chuẩn hoá format giữa Claude (tool_use + array content) và Gemini (functionCall + parts object), cho phép **plug-and-play** mô hình mới. Auto-fallback khi provider chính lỗi.

### 5.4. Phân quyền hai lớp
Marketplace tách `admin` (toàn hệ thống) và `company_admin` (nhà xe). Mọi query đều scope theo `companyId` ở middleware để nhà xe A không xem được dữ liệu nhà xe B.

## 6. Các tính năng còn lại / dự kiến

| Hạng mục | Ưu tiên | Ghi chú |
|---|---|---|
| Time guard cho check-in (chặn quét sai giờ) | Cao | Đang triển khai |
| Block refund khi vé đã check-in | Cao | Cần fix nhanh |
| Audit log: ai check-in vé nào | Trung bình | Thêm field `checkedInById` |
| Auto-complete booking sau khi chuyến chạy xong | Trung bình | Cron mới |
| KB2 — Kiểm tra `vnp_Amount` tường minh | Thấp | HMAC đã chặn ngầm, chỉ là defense-in-depth |
| Settlement reconciliation cuối ngày | Thấp | Cần file đối soát VNPay (production thật) |
| Trang chi tiết review + reply của nhà xe | Thấp | UX nâng cao |
| Đa ngôn ngữ EN/VI | Thấp | Chatbot đã hỗ trợ, UI thì chưa |

## 7. Khó khăn và bài học

- **Format tool calling khác nhau giữa Claude và Gemini**: mất công viết layer adapter, đặc biệt khi tool result là array (Gemini yêu cầu Object Struct).
- **Tên thành phố không thống nhất**: AI sinh "TPHCM" nhưng DB lưu "TP.HCM" → giải bằng normalize NFD + strip ký tự đặc biệt + JS filter thay cho `contains`.
- **VNPay sandbox không gọi IPN ổn định**: phải tự đối soát bằng QueryDR.
- **httpOnly cookie + CORS multi-origin** (Vercel ↔ Render khác domain): cần `SameSite=None; Secure` ở prod và `Lax` ở dev → 2 chế độ riêng.
- **Race condition khi giữ ghế**: dùng Prisma `$transaction` + cron release expired booking để chống ghế kẹt vĩnh viễn.

## 8. Kết luận

Dự án đã đạt **mức MVP đầy đủ tính năng** của một marketplace bán vé xe khách thực tế: từ đặt vé – thanh toán – hoàn tiền – check-in – báo cáo doanh thu – phân quyền nhà xe. Các tính năng nâng cao như **chatbot AI đa nhà cung cấp**, **đối soát thanh toán tự động**, **realtime notification** vượt khỏi yêu cầu cơ bản và mang tính production-grade.

Phần còn lại chủ yếu là **hardening** (chặn edge case check-in) và **polish UX** trước khi bảo vệ.

---

*Báo cáo được tạo tự động từ trạng thái mã nguồn ngày 03/06/2026.*
