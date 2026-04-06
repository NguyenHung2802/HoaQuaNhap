# Master Plan - Phase 08: Optimization & Advanced Features

- Ngày: 2026-04-03
- Phiên bản: v1
- BA nguồn: 00_ba.md

## 1) Goal
Triển khai hệ thống mã giảm giá (Coupon), báo cáo doanh thu chuyên sâu (Advanced Reports), tối ưu hóa SEO và hiệu năng cho website WebHoaQua.

## 2) Scope
- **In-scope**:
    - Admin: Quản lý Coupon, Dashboard báo cáo nâng cao (Biểu đồ Chart.js, Top khách hàng, Sản phẩm bán chậm), Tiện ích nhân bản sản phẩm.
    - Public: Áp dụng mã giảm giá tại Checkout, Lazy load ảnh, SEO Schema Product, Sitemap/Robots.
- **Out-of-scope**: Thanh toán online, Đa ngôn ngữ, Tích điểm thành viên.

## 3) Constraints & Assumptions
- **Constraints**: Sử dụng Chart.js (CDN hoặc NPM), EJS cho giao diện, Prisma cho query dữ liệu.
- **Assumptions**: 
    - Database hiện tại đủ để truy vấn doanh thu theo ngày/tháng.
    - Các ảnh sản phẩm đã lưu trên Cloudinary hỗ trợ dynamic transformation.
- **Questions**: Không có câu hỏi quan trọng tại thời điểm này.

## 4) Recommended Approach
- Triển khai **Vertical Slices** để đảm bảo mỗi tính năng đều chạy được từ DB đến UI trước khi sang tính năng khác.
- Dùng **Prisma Transactions** khi áp dụng Coupon để tránh race condition về lượt dùng.
- Dùng **Middleware** hoặc service riêng để gen Sitemap/Robots định kỳ hoặc on-demand.

## 5) Slice Plan

```
SLICE  GOAL                              DELIVERABLES                     DoD (testable)                 VERIFY (lệnh)                     CHECKPOINT
---    ---                               ---                              ---                             ---                               ---
S34    Admin: Quản lý Coupon             CRUD UI + Model Coupon           Coupon tạo mới thành công        npm run dev + Manual test         Sau khi pass
S35    Public: Áp dụng Coupon            Checkout Logic + Apply API       Giảm giá đúng khi đặt hàng      npm run dev + Manual test         Sau khi pass
S36    Admin: Báo cáo Doanh thu          Revenue Charts (Chart.js)        Hiển thị biểu đồ chính xác      npm run dev + Manual test         Sau khi pass
S37    Admin: Báo cáo KH & SP            Top Customers + Slow Products    Dữ liệu list chính xác          npm run dev + Manual test         Sau khi pass
S38    SEO & Performance                 Sitemap/Schema/Lazy load         Sitemap.xml ok, Schema ok       npm run dev + Page Speed/SEO tool Sau khi pass
S39    Admin Utils: Duplicate SP         Duplicate button in Admin        Clone SP với 1 click            npm run dev + Manual test         Sau khi pass
```

## 6) Detailed Implementation Checklist

### Slice S34: Admin Coupon Management
- [ ] Implement `coupons.service.js` (getAll, create, update, delete).
- [ ] Implement `coupons.controller.js` (render views, handle post).
- [ ] Create views: `src/views/admin/coupons/index.ejs`, `add.ejs`, `edit.ejs`.
- [ ] Update admin sidebar to include Coupons.

### Slice S35: Public Coupon Application
- [ ] Implement `applyCoupon` API in `src/modules/coupons/coupons.controller.js`.
- [ ] Update Checkout view with coupon input field.
- [ ] Update Order logic to handle `discount_amount` and `coupon_code`.
- [ ] Handle validation: Expired, Min Order, Max Usage.

### Slice S36: Admin Revenue Reports
- [ ] Implement `reports.service.js` to aggregate revenue data (Daily/Weekly/Monthly).
- [ ] Integrate Chart.js in `src/views/admin/reports/revenue.ejs`.
- [ ] Create route for reports dashboard.

### Slice S37: Admin Customer & Product Insights
- [ ] Implement query for Top Customers (by total_spent).
- [ ] Implement query for Slow-moving Products (sales = 0 or low in period).
- [ ] Create view `src/views/admin/reports/insights.ejs`.

### Slice S38: SEO & Performance
- [ ] Implement `sitemap` generator (dynamic route `/sitemap.xml`).
- [ ] Create static `public/robots.txt`.
- [ ] Add JSON-LD Schema.org to `product_detail.ejs`.
- [ ] Implement Lazy loading for all `<img>` tags in site.
- [ ] Update Cloudinary URLs to use quality auto and webp format.

### Slice S39: Admin Duplicate Product
- [ ] Add "Duplicate" button in Product Listing.
- [ ] Implement logic in `products.controller.js` to clone record and images.

## 7) Data & Migration Plan
- Schema `Coupon` đã có. Cần đảm bảo `Order` có đủ field `discount_amount` và `coupon_code`.
- Chạy `npx prisma generate` sau khi verify schema.

## 8) Verification Plan
- Manual testing từng luồng Admin/Public.
- Kiểm tra query SQL/Prisma có tối ưu không (tránh N+1 khi báo cáo).

## 9) Risks & Mitigations
- **Performance**: Query báo cáo trên dữ liệu lớn có thể chậm -> Suggest thêm index cho `created_at` của `Order`.
- **Logic**: Áp dụng mã giảm giá chồng chéo -> Quy định chỉ dùng 1 mã/đơn.

## 12) DEEP THINKING RESULTS
### A) Phản biện kỹ thuật:
1. **Dùng Redis cho cache?**: Hiện tại dữ liệu chưa quá lớn, Prisma query trực tiếp vẫn ổn. Sẽ đề xuất nếu cần thiết ở Phase 9.
2. **Duplicate Product**: Cần lưu ý không clone slug (slugify lại từ name + "-copy" hoặc random string để tránh duplicate key constraint).
3. **Sitemap**: Nên cache sitemap vì nó không thay đổi liên tục, tiết kiệm tài nguyên DB.

### B) Đề xuất chủ động:
- Triển khai **Email Notification** (từ Phase 5) nhắc khách hàng về coupon sắp hết hạn (nếu có hệ thống email).
- Thêm **Auto-alt text** cho ảnh từ Product Name để SEO tốt hơn.

## 11) Next Action
- Chờ USER xác nhận Master Plan và phân chia S34-S39.
