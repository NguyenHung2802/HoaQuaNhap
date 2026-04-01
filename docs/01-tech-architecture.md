# Công nghệ và Kiến trúc Hệ thống

## 1. Công nghệ sử dụng

### 1.1. Stack chính

- **Node.js**: xử lý backend
- **Express.js**: framework web cho Node.js
- **EJS**: render giao diện phía server
- **PostgreSQL**: hệ quản trị cơ sở dữ liệu
- **Prisma ORM**: quản lý schema và truy vấn DB
- **Cloudinary**: lưu và tối ưu ảnh
- **Redis**: cache, queue, session (dùng sau nếu cần)

### 1.2. Các thư viện nên cân nhắc

#### Backend
- express, prisma, @prisma/client, dotenv, bcrypt / bcryptjs, jsonwebtoken, cookie-parser, express-session, connect-flash, multer, cloudinary, morgan / winston / pino, zod hoặc joi để validate, helmet, express-rate-limit, cors, dayjs

#### Frontend / giao diện
- ejs, express-ejs-layouts, bootstrap / tailwind bản build sẵn / custom CSS, swiper (banner slider), chart.js (dashboard)

#### Dev tools
- nodemon, eslint, prettier, prisma migrate, dotenv-safe, concurrently

## 2. Kiến trúc tổng thể hệ thống

Hệ thống gồm 3 phần chính:

### 2.1. Public website
Dành cho khách hàng:
- Trang chủ
- Danh mục
- Chi tiết sản phẩm
- Giỏ hàng
- Đặt hàng
- Theo dõi đơn
- Blog / giới thiệu / liên hệ

### 2.2. Admin dashboard
Dành cho quản trị:
- Dashboard
- Quản lý sản phẩm
- Quản lý danh mục
- Quản lý đơn hàng
- Quản lý tồn kho
- Quản lý khách hàng
- Quản lý banner / nội dung
- Báo cáo

### 2.3. Backend system
Xử lý:
- Auth, CRUD dữ liệu, Nghiệp vụ đơn hàng, Tồn kho, Ảnh sản phẩm, Thống kê, Ghi log, Validation, Phân quyền
