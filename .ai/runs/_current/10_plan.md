# Master Plan — Giai đoạn 2: Auth Admin & Phân quyền Người dùng

- **Feature**: Phase 2 — Unified Auth
- **BA nguồn**: 00_ba.md
- **Ngày**: 2026-04-01

## 1) Goal
Thiết lập hệ thống đăng nhập Admin bằng Session, đồng thời chuẩn bị cấu trúc bảng User hợp nhất cho cả Admin và Khách hàng (Customer).

## 2) Scope
- **In-scope**:
    - Cập nhật Prisma Schema (Model User với field `role`).
    - Nạp dữ liệu mẫu (Seed) cho tài khoản Admin đầu tiên.
    - Xây dựng giao diện Login Admin.
    - Xử lý logic Login/Logout tại Server.
    - Middleware `authMiddleware.js` để bảo vệ route `/admin`.
- **Out-of-scope**: Đăng ký khách hàng, Quản lý tài khoản khách (GĐ sau).

## 3) Constraints & Assumptions
- **Constraints**: Sử dụng `express-session` đã cấu hình trong `app.js`.
- **Assumptions**: Email là duy nhất (unique) để làm định danh đăng nhập.

## 4) Recommended approach
- Sử dụng **Session-based Authentication** vì phù hợp với kiến trúc SSR (EJS) hiện tại.
- Mật khẩu được mã hóa bằng **bcryptjs**.
- Phân quyền đơn giản qua cột `role`: `admin` và `customer`.

## 5) Slice Plan
```
SLICE  GOAL                              DELIVERABLES                     DoD (testable)                 VERIFY (lệnh)                     CHECKPOINT
---
S1     Database & Model                  Prisma Schema, Migration, Seed   Có bảng User với role          npx prisma studio                Sau khi migration
S2     Admin Login UI                    Login EJS, CSS                   Giao diện login hiển thị đúng  Truy cập /admin/login            Sau khi UI xong
S3     Auth Core Logic                   Controller, Service, Route       Login/Logout thành công        Check session DB/Console         Sau khi logic xong
S4     Protection Middleware             authMiddleware.js                Chặn /admin khi chưa login     Truy cập /admin bị redirect      Sau khi hoàn thành
```

## 6) Detailed Implementation Checklist
- **Slice S1: Database & Model**
    - [ ] Cập nhật `prisma/schema.prisma`: Thêm `role` vào model `User`.
    - [ ] Chạy `npx prisma migrate dev`.
    - [ ] Cập nhật `prisma/seed.js` để tạo tài khoản Admin mẫu với mã hóa bcrypt.
- **Slice S2: Admin Login UI**
    - [ ] Tạo `src/views/admin/auth/login.ejs`.
    - [ ] Tích hợp CSS cho trang login (Modern design).
- **Slice S3: Auth Core Logic**
    - [ ] Viết `auth.controller.js` (xử lý POST login, GET logout).
    - [ ] Viết `auth.service.js` (kiểm tra password bcrypt).
    - [ ] Đăng ký route `/admin/login`, `/admin/logout`.
- **Slice S4: Protection Middleware**
    - [ ] Viết `src/middlewares/auth.middleware.js`.
    - [ ] Áp dụng middleware vào các route trong `admin.route.js`.

## 12) Deep Thinking Results
- **Devil's Advocate**: 
    - *Vấn đề*: Guest user (không đăng nhập) có bị nhầm lẫn với Customer không? 
    - *Giải quyết*: Guest thông tin nằm ở Order, Customer thông tin nằm ở User. Khi Checkout sẽ check: nếu User logged-in -> gắn customer_id; nếu Guest -> để trống customer_id nhưng lưu text vào snapshot fields.
- **Proactive Proposal**: 
    - Nên thêm cơ chế "Remember Me" đơn giản bằng cách tăng `maxAge` của session cookie nếu user tick vào checkbox.

## 11) Next Action
- Yêu cầu User xác nhận Master Plan này trước khi chia file slice chi tiết.
