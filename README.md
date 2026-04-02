# Website Bán Hoa Quả Nhập Khẩu (WebHoaQua)

Dự án thiết kế và phát triển website bán trái cây nhập khẩu chất lượng cao với đầy đủ tính năng dành cho khách hàng (Public) và quản trị viên (Admin).

---

## 🚀 Tài liệu chi tiết các giai đoạn triển khai (Roadmap)

Dự án được chia thành các phần tài liệu chi tiết để đảm bảo tính minh bạch, dễ dàng bảo trì và không bị đè luồng công việc. Hãy lần lượt triển khai theo đúng trình tự sau:

### 1. Giới thiệu & Tổng quan (Introduction)
[Đọc chi tiết tại đây](docs/00-intro.md)
*Gồm: Mục tiêu kinh doanh, Đối tượng khách hàng, Phạm vi MVP.*

### 2. Công nghệ & Kiến trúc (Stack & Architecture)
[Đọc chi tiết tại đây](docs/01-tech-architecture.md)
*Gồm: Node.js, Express, EJS, PostgreSQL, Prisma, Cloudinary.*

### 3. Chức năng & Sơ đồ trang (Features & Sitemap)
[Đọc chi tiết tại đây](docs/02-features-sitemap.md)
*Gồm: Tổng hợp các tính năng Public/Admin, Sơ đồ cấu trúc URL.*

### 4. Quy trình nghiệp vụ (Business Workflow)
[Đọc chi tiết tại đây](docs/03-workflow.md)
*Gồm: Luồng bán hàng, Quy trình quản lý kho, Luồng xử lý đơn hàng.*

### 5. Lộ trình triển khai (Phase-by-Phase Roadmap)
[Đọc chi tiết tại đây](docs/04-roadmap-checklist.md)
*Dưới đây là link chi tiết cho từng Giai đoạn cụ thể:*

| Giai đoạn | Mô tả nội dung | Trạng thái |
| :--- | :--- | :--- |
| [GĐ 1](docs/phases/01-initiation.md) | **Khởi tạo hệ thống**, cấu hình DB, Layout. | ✅ Hoàn thành |
| [GĐ 2](docs/phases/02-auth-admin.md) | **Hệ thống Auth (Admin/Customer)**, Middleware, Unified Login. | ✅ Hoàn thành |
| [GĐ 3](docs/phases/03-category-product.md) | **Quản lý SP & DM**, Upload ảnh, Tồn kho. | ⏳ Chờ thực hiện |
| [GĐ 4](docs/phases/04-public-site.md) | **Public Website**, Home, Shop, Listing. | ⏳ Chờ thực hiện |
| [GĐ 5](docs/phases/05-cart-order.md) | **Giỏ hàng & Checkout**, Tạo Order (COD). | ⏳ Chờ thực hiện |
| [GĐ 6](docs/phases/06-admin-op.md) | **Vận hành admin**, Cập nhật đơn, Dashboard. | ⏳ Chờ thực hiện |
| [GĐ 7](docs/phases/07-content.md) | **Nội dung**, Blog, Banner, SEO hỗ trợ. | ⏳ Chờ thực hiện |
| [GĐ 8](docs/phases/08-optimization.md) | **Nâng cao**, Voucher, Báo cáo chuyên sâu. | ⏳ Chờ thực hiện |
| [GĐ 9](docs/phases/09-production.md) | **Production**, SSL, Domain, Backup. | ⏳ Chờ thực hiện |

---

## 🛠️ Quy định phát triển (Standards)

Mọi thay đổi cần bám sát:
- [Tiêu chuẩn hoàn thành & Kiểm thử](docs/05-standards.md)
- Cấu trúc thư mục: Tuân thủ mô hình Module (Controller - Service - Route).
- Prisma: Mọi thay đổi schema cần chạy migrate và cập nhật tài liệu.

---

*Lưu ý: Mọi thay đổi khác với kế hoạch gốc cần được cập nhật ngay tại file README chính này và các tài liệu liên quan trong thư mục `/docs`.*
