# Giai đoạn 2 — Xây dựng auth admin

## Mục tiêu
Thiết lập hệ thống đăng nhập cho quản trị viên.

## Việc cần làm
- [x] Tạo bảng `users` trong schema Prisma (Unified Model)
- [x] Tạo file seed cho admin user đầu tiên (`prisma/seed.js` with Bcrypt)
- [x] Xây dựng trang login admin (`src/views/admin/auth/login.ejs`)
- [x] Xây dựng controller và service cho Auth
- [x] Cấu hình session và flash messages
- [x] Xây dựng middleware bảo vệ route admin (`isAdmin`)
- [x] Chức năng Logout

## Kết quả đầu ra
- Quản trị viên có thể đăng nhập / đăng xuất
- Các route `/admin` bị chặn nếu chưa đăng nhập
- Flash message thông báo thành công / lỗi khi đăng nhập
