# Lộ trình và Checklist Tổng quát

## Cập nhật 2026-08-10 — Sản phẩm nhiều danh mục

- [x] Giữ danh mục chính để tương thích dữ liệu cũ.
- [x] Thêm quan hệ nhiều-nhiều và backfill bằng Prisma migration.
- [x] Cập nhật Admin CRUD, public listing, sản phẩm liên quan, promotion và checkout.
- [x] Bổ sung hướng dẫn migrate/deploy tại `docs/11-product-multi-category-migration.md`.

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
- [x] Chốt color palette thương hiệu (Green/Yellow)
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
- [x] Cart Session handler (Done: S24)
- [x] Checkout form (Validation Info) (Done: S25)
- [x] Success page (Done: S26)
- [x] Trừ tồn kho tạm khi nhận đơn (Done: S26)

### 2.7. Admin Operations
- [x] Order Listing / Search (Done: S27)
- [x] Order Status transition (History logs) (Done: S28)
- [x] Dashboard charts (Revenue) (Done: S29)
- [x] Inventory Management Overview (Done: Fixed)

### 2.8. Nội dung & Truyền thông (Giai đoạn 7)
- [x] Banner Management (S30 — Slider dynamic)
- [x] Blog / News Management (S31 — Quill Editor, Public list/detail)
- [x] Product Reviews (S32 — Default visibility 100%, Admin Hide/Show toggle, User info pre-fill)
- [x] Static Pages (S33 — FAQ, Policies, About, Settings model)

### 2.9. Tối ưu & Nâng cao (Giai đoạn 8)
- [x] Meta Title/Description động (Done)
- [x] Breadcrumbs (Done)
- [x] Coupon / Discount code (S34-S35: Admin CRUD & Public Apply)
- [x] Báo cáo doanh thu & Thống kê Admin (S36-S37: Chart.js & Insights)
- [x] SEO: Sitemap.xml & Robots.txt (S38)
- [x] Schema.org JSON-LD (Product Detail) (S38)
- [x] Performance: Lazy loading images (S38)
- [x] Tính năng Nhân bản sản phẩm (S39: Duplicate)
- [x] Chiến dịch khuyến mãi (S40-S43: Admin CRUD, Public Checkout Apply, Product Detail Display)
- [x] Quản lý Khách hàng (S44: Admin List/Detail/Edit/Delete, Stats, Order History, Public Profile & Address CRUD)
### 2.10. Nâng cấp Visual & UI/UX (Phase A)
- [x] Hiệu ứng cuộn AOS (Animate On Scroll) cho toàn bộ public site.
- [x] Chuyển đổi toàn bộ Flash Messages sang SweetAlert2 Toast chuyên nghiệp.
- [x] Tối ưu CSS Hover, Shadows và Micro-interactions cho thẻ sản phẩm.
- [x] Triển khai Mobile Bottom Navigation Bar chuẩn ứng dụng di động.
- [ ] Production deployment (Linux/VPS/Docker) (Giai đoạn 9)
### 2.11. Homepage Revamp & Content Authenticity (Phase 10 — 2026-04-13)
- [x] **Hero Section:** Thay 1 ảnh fallback xấu → 3 slides động với ảnh trái cây, giỏ quà, rau quả từ Unsplash.
- [x] **Trust Bar:** Thêm thanh badge "Nhập khẩu chính hãng / Giao nội thành HN trong ngày / Đổi trả 24h / CSKH 8-21h".
- [x] **Sản phẩm Yêu Thích:** Fix dedup logic (Map theo ID, ưu tiên best_seller > featured, pool tăng lên 8).
- [x] **Combo Section:** Redesign hoàn toàn → 4 cards responsive (Buổi Sáng, Quà Biếu, Mùa Hè, Gia Đình), mỗi card link đến filter phù hợp.
- [x] **Testimonials:** Thay địa danh TP.HCM, Đà Nẵng → Cầu Giấy / Hoàn Kiếm / Tây Hồ (Hà Nội).
- [x] **Trang About:** Tạo nội dung đầy đủ — câu chuyện thương hiệu, giá trị cốt lõi, số liệu, CTA. Địa danh Hà Nội chuẩn.
- [x] **Trang Shipping Policy:** Tạo nội dung đầy đủ — bảng phí, khu vực giao hàng (chỉ Hà Nội), thời gian, chính sách đổi trả.
- [x] **Routes:** `/about` và `/shipping` render trực tiếp từ EJS (không phụ thuộc DB setting).

### 2.12. Nâng cấp Chuyên sâu & Cơ chế giữ chân khách hàng (Phase 11)
- [ ] Tham chiếu Master Plan chi tiết trong `.ai/runs/_current/11_plan.md`
- [x] Hoàn thiện Phase 9 UI: Frontend Contact Popup
- [x] Tính năng Tra cứu Đơn hàng cho Khách vãng lai (Guest Tracking)
- [x] Plugin Flash Sale Khung Giờ Vàng
- [ ] Thuật toán Gợi ý Sản phẩm Liên Quan / Mua Cùng (Cross-Selling - đã sửa hiển thị campaign ship trong cart và reload giỏ khi thêm từ block gợi ý)
- [ ] Membership & Loyalty Points (Tích điểm Quả Dâu - đã xong schema, cộng/trừ điểm trong checkout và hiển thị điểm ở checkout/profile)
- [ ] Worker Sao lưu Cơ sở Dữ liệu (Auto Backup Database) — đã có `scripts/backup-db.js`, cần cài cron trên VPS (docs/14)
### 2.13. Homepage Analysis & Menu Fix (Phase 12 — 2026-05-08)
- [x] **Phân tích cơ chế hiển thị**: Đã BA chi tiết 3 sections (Categories, Featured, Combo).
- [x] **Fix Menu Hover**: Desktop hover hiện dropdown, click navigate. Mobile click toggle.
- [x] **Fix Categories orderBy**: Thêm `sort_order ASC` cho query categories trang chủ.
- [x] **Cải thiện Combo links**: Thay hardcoded links bằng filter category thực tế (dau-tay, nho-nhap-khau, tao-nhap-khau).
- [ ] **Tương lai**: Tạo model Combo/Bundle/Gift Set, Admin CRUD, Tags/Labels (xem recommendations log).
### 2.14. Phân cấp Danh mục (Category Hierarchy — 2026-07-06)
- [x] **Menu Navbar Đa Cấp**: Ẩn danh mục con trên menu cấp 1, chỉ hiển thị khi hover danh mục cha. Hỗ trợ toggle trên mobile.
- [x] **Sidebar Shop Filter**: Thụt lề và hiển thị danh mục con phân cấp trực quan.
- [x] **Sidebar Shop Filter Nâng cao (2026-07-28)**: Ẩn danh mục con cấp 2 mặc định, chỉ hiển thị khi hover danh mục cha hoặc khi danh mục cha/con tương ứng hoạt động (active).
- [x] **Mô tả Sản phẩm Rich Text (2026-07-28)**: Tích hợp Quill Editor vào trang thêm/sửa sản phẩm trong Admin và hỗ trợ hiển thị đẹp mắt (HTML & tương thích plain text) tại trang chi tiết sản phẩm.
- [x] **Thuật toán Lọc Sản phẩm**: Lọc danh mục cha hiển thị sản phẩm của cả danh mục cha và các danh mục con.
- [x] **Breadcrumbs Đa Cấp**: Hiển thị đầy đủ đường dẫn cha -> con trên trang chi tiết sản phẩm.
- [x] **Sidebar Shop Filter Trực quan (2026-07-29)**: Luôn hiển thị chevron, số mục con và tổng sản phẩm theo nhóm; hỗ trợ click/keyboard ngoài hover.
- [x] **Thông tin Dinh dưỡng Rich Text (2026-07-29)**: Quill ở Admin create/edit, card rich text ở trang chi tiết và tương thích dữ liệu plain text cũ.
### 2.15. Nâng cấp Giao diện, API đăng bài (n8n), Tin tức ẩn + Popup Affiliate (Phase 13 — 2026-11-12)
- [x] BA v9: `.ai/runs/_current/00_ba_v9_addendum.md`
- [x] Master Plan v9 (S42–S54): `.ai/runs/_current/10_plan_v9.md` — chờ chủ web xác nhận để tạo file slice.
- [x] S50: 3 bản mẫu giao diện trong `docs/mockups/`; đã CHỐT bản C nền trắng (mẫu `mau-c2-nen-trang.html`, giữ nhận diện và bố cục cũ).
- [x] S42 Nền dữ liệu (đã viết migration, chưa áp lên DB thật) (BlogPost mở rộng, ApiKey, NewsStatDaily)
- [x] S43 Pipeline nội dung và media (sanitize, slug, Cloudinary stream) — cần `npm install` để cài sanitize-html
- [x] S44 API key + `POST /api/v1/posts` (xem docs/12-api-posts.md; chưa thử với DB/Cloudinary thật)
- [x] S45 Admin tin tức ẩn (/admin/news, cài đặt news.*; chưa xem trên trình duyệt với DB thật)
- [x] S46 Host routing + trang tin ẩn (subdomain `tin.`; xem docs/13-news-subdomain.md; chưa thử Nginx/DB thật)
- [x] S47 Popup affiliate + thống kê (đã thử bằng trình duyệt; chưa thử Safari iOS/in-app, chưa thử DB thật)
- [x] S48 Trang bài viết chuyên nghiệp (blog: SEO/OG/JSON-LD, mục lục, chia sẻ, liên quan; đã xem desktop/mobile)
- [x] S49 Vận hành VPS 1GB (gộp PrismaClient, cache menu, /healthz, PM2, script backup, docs/14; chưa chạy trên VPS thật)
- [x] S51 Design system + layout chung v2 (lớp phủ CSS/JS, ngăn kéo giỏ, cờ UI_THEME; docs/15-ui-theme-v2.md)
- [x] S52 Trang chủ mới (hero editorial + tinh chỉnh các khối; classic không đổi; đã xem desktop/mobile)
- [x] S53 Shop + chi tiết sản phẩm mới (lọc không tải lại trang, thêm nhanh, thanh mua dính; classic không đổi)
- [x] S54 Giỏ hàng + checkout mới (chỉ đổi trình bày; form thanh toán giống hệt classic; CHƯA chạy đặt hàng thật)
- [x] S55 Tối ưu tốc độ tải v2 (tự phục vụ thư viện/phông, bỏ AOS, hero CSS thuần; DOMContentLoaded ~3,5s → ~0,4s)
- [ ] Deploy Phase 13: làm theo `docs/16-phase13-deploy-checklist.md` (staging trước, thử đặt hàng thật)
---
> [!TIP]
> Hãy luôn cập nhật checklist sau mỗi Giai đoạn hoàn thành thành công và được test kỹ lưỡng.
- Phase 13 / S58 (2026-11-13): tăng bảo mật đăng nhập (admin dùng chung /auth/login với khách): chặn dò mật khẩu theo IP + theo email (5 lần/email, 20 lần/IP mỗi 15 phút, trong bộ nhớ, không cần Redis — src/middlewares/login-throttle.middleware.js), thông báo lỗi dùng chung một câu "Email hoặc mật khẩu không đúng" (không còn lộ email nào có tài khoản), so mật khẩu với hash giả khi tài khoản không tồn tại (chặn dò qua thời gian phản hồi), cookie phiên thêm httpOnly + sameSite=lax. Ghi log cảnh báo khi đăng nhập sai, ghi log khi admin đăng nhập thành công. Test: tests/s58-login-throttle.test.js. Chưa làm: CAPTCHA, 2FA, đổi đường dẫn /admin, khóa tài khoản lâu dài trong DB (xem gợi ý thêm bên dưới).
- Phase 13 / S57 (2026-11-13): trang chủ v2: 'Bộ sưu tập theo nhu cầu' viết lại dạng bento, dữ liệu thật từ danh mục (src/modules/public/home/collections.service.js, public/css/home-v2.css); /products hỗ trợ ?category=a,b. Test: tests/s57-home-collections.test.js.
