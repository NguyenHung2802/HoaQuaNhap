# Giai đoạn 2 — Xây dựng hệ thống Auth & Quản lý danh tính

## Mục tiêu
Thiết lập hệ thống đăng nhập, đăng ký và quản lý tài khoản cho cả Quản trị viên (Admin) và Khách hàng (Customer).

## Việc cần làm
### 1. Nền tảng Auth
- [x] Tạo bảng `users` trong schema Prisma (Unified Model)
- [x] Tạo file seed cho admin user đầu tiên (`prisma/seed.js` with Bcrypt)
- [x] Cấu hình session và flash messages
- [x] Xây dựng middleware bảo vệ route (`isAdmin`, `isCustomer`)
- [x] Chức năng Đăng xuất chung

### 2. Admin Auth
- [x] Xây dựng Unified Login Controller (Role-based redirect)
- [x] Middleware bảo vệ route admin (`isAdmin`)
- [x] Redirect `/admin/login` sang hệ thống đăng nhập chung

### 3. Customer Auth & Guest Checkout
- [x] Xây dựng trang Đăng ký tài khoản (`/auth/register`)
- [x] Xây dựng trang Đăng nhập người dùng (`/auth/login`)
- [x] Logic liên kết User với hồ sơ Customer (Profile)
- [x] Luồng đặt hàng nhanh (Quick Checkout) cho khách vãng lai (Guest)
- [x] Modal can thiệp (Intervention Modal) khi khách chưa login nhấn mua hàng

## Kết quả đầu ra
- Hệ thống định danh hợp nhất: Admin login -> Dashboard, Customer login -> Home.
- Khách vãng lai có thể mua nhanh mà không cần tài khoản.
- Tài liệu hóa luồng đăng ký và quản lý đơn hàng cơ bản.
