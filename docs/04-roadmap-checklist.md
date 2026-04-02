# Lộ trình và Checklist Tổng quát

## 1. Thứ tự triển khai chi tiết

Mục tiêu là đi đúng trình tự để không bị rối:

1. **Giai đoạn 1**: [Khởi tạo hệ thống](01-initiation.md)
2. **Giai đoạn 2**: [Auth Admin](02-auth-admin.md)
3. **Giai đoạn 3**: [Danh mục & Sản phẩm](03-category-product.md)
4. **Giai đoạn 4**: [Public Website](04-public-site.md)
5. **Giai đoạn 5**: [Giỏ hàng & Đặt hàng](05-cart-order.md)
6. **Giai đoạn 6**: [Vận hành & Dashboard](06-admin-op.md)
7. **Giai đoạn 7**: [Nội dung & Truyền thông](07-content.md)
8. **Giai đoạn 8**: [Tối ưu & Nâng cao](08-optimization.md)
9. **Giai đoạn 9**: [Production](09-production.md)

## 2. Checklist tổng quát (MVP)

### 2.1. Chuẩn bị
- [x] Chốt tên dự án (WebHoaQua)
- [ ] Chốt color palette thương hiệu (Green/Yellow)
- [x] Chốt cấu trúc dữ liệu (Prisma schema)
- [x] Chốt kiến trúc Node.js/Express

### 2.2. Hệ thống nền
- [x] Init Node.js, Express, Prisma
- [x] Layout EJS Public/Admin
- [x] ENV, Morgan, Helmet, Cors
- [x] Error 404/500 pages

### 2.3. Auth & Users
- [x] Bảng Users & Password Bcrypt
- [x] Auth middleware & Session
- [x] Login/Logout admin (Dùng chung cổng Unified)
- [x] Register/Login Customer
- [x] Guest Checkout intervention logic

### 2.4. Danh mục & Sản phẩm
- [x] CRUD Model Category (Done: S7, S8)
- [x] CRUD Model Product (Done: S9, S10)
- [x] Image Upload (Cloudinary) (Multi-images Product OK - S11, S23)
- [x] Slug generation (Slugify) (Category & Product Name OK)
- [x] Inventory Logging (Done: S12)
- [x] Seeding Sample Data (Done: S13)

### 2.5. Website Public
- [x] Header/Footer/Navbar (S15 — Dynamic categories, Search, Cart badge)
- [x] Home page (S16-S18 — Hero, Category circles, Featured, Promo, Why Us, Testimonials, Blog)
- [x] Listing / Search / Filter (S19, S21 — Sidebar filter: Origin, Price Range, Status, Pagination)
- [x] Detail page (S20, S22 — Swiper Gallery, Fancybox Image Zoom, Specs, QTY, Tabs)

### 2.6. Giỏ hàng & Order
- [ ] Cart Session handler
- [ ] Checkout form (Validation Info)
- [ ] Success page
- [ ] Trừ tồn kho tạm khi nhận đơn

### 2.7. Admin Operations
- [ ] Order Listing / Search
- [ ] Order Status transition (History logs)
- [ ] Dashboard charts (Revenue)

### 2.8. Tối ưu SEO
- [ ] Meta Title/Description động
- [ ] Breadcrumbs
- [ ] Thêm thẻ Alt cho ảnh tự động

---
> [!TIP]
> Hãy luôn cập nhật checklist sau mỗi Giai đoạn hoàn thành thành công và được test kỹ lưỡng.
