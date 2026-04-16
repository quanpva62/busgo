# BusGo Vietnam — Backend

## Dự án

Website bán vé xe khách trực tuyến, mô hình marketplace nhiều nhà xe, tích hợp AI Chatbot.

## Tech Stack

- Node.js + Express.js
- Prisma ORM v5.22.0 + PostgreSQL 15 (Supabase)
- JWT Auth (Access 15p + Refresh 7 ngày)
- VNPay Sandbox (thanh toán)
- Nodemailer + Gmail SMTP (email)
- Anthropic Claude API + Tool Use (chatbot)

## Cấu trúc thư mục

src/
├── controllers/ # Xử lý logic
├── routes/ # Định nghĩa endpoints
├── middlewares/ # auth, validate
├── validators/ # express-validator
└── lib/prisma.js # Prisma client

## Đã làm xong

- Auth API (register, login, me)
- Trips API (search, detail, seats)
- Booking API (create, get, cancel) ← đang làm

## Cần làm tiếp

1. Payment API (VNPay)
2. Ticket API
3. Report + Review API
4. Admin API
5. Chatbot API
6. Frontend (React)

## Lưu ý quan trọng

- UUID làm primary key tất cả bảng
- userId nullable trong Booking (guest checkout)
- departureTime lưu UTC, Việt Nam UTC+7
- Prisma dùng $transaction cho các thao tác quan trọng
- User vừa làm vừa học nên hãy đưa ra các gợi ý chứ đừng 1 phát cho code luôn
- Sau mỗi feature hoàn thành sẽ push lên github
- Hãy tham khảo, hoàn thiện dựa trên design trong folder stitch

Tradeoff: These guidelines bias toward caution over speed. For trivial tasks, use judgment.

1. Think Before Coding
   Don't assume. Don't hide confusion. Surface tradeoffs.

Before implementing:

State your assumptions explicitly. If uncertain, ask.
If multiple interpretations exist, present them - don't pick silently.
If a simpler approach exists, say so. Push back when warranted.
If something is unclear, stop. Name what's confusing. Ask. 2. Simplicity First
Minimum code that solves the problem. Nothing speculative.

No features beyond what was asked.
No abstractions for single-use code.
No "flexibility" or "configurability" that wasn't requested.
No error handling for impossible scenarios.
If you write 200 lines and it could be 50, rewrite it.
Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

3. Surgical Changes
   Touch only what you must. Clean up only your own mess.

When editing existing code:

Don't "improve" adjacent code, comments, or formatting.
Don't refactor things that aren't broken.
Match existing style, even if you'd do it differently.
If you notice unrelated dead code, mention it - don't delete it.
When your changes create orphans:

Remove imports/variables/functions that YOUR changes made unused.
Don't remove pre-existing dead code unless asked.
The test: Every changed line should trace directly to the user's request.

4. Goal-Driven Execution
   Define success criteria. Loop until verified.

Transform tasks into verifiable goals:

"Add validation" → "Write tests for invalid inputs, then make them pass"
"Fix the bug" → "Write a test that reproduces it, then make it pass"
"Refactor X" → "Ensure tests pass before and after"
For multi-step tasks, state a brief plan:

1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
   Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

These guidelines are working if: fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
