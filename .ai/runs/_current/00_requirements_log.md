# Nhật ký yêu cầu gốc - Phase 08: Optimization

- Ngày tạo: 2026-04-03 11:45
- Feature: Giai đoạn 08 - Tối ưu & Nâng cao

## Yêu cầu gốc (từ docs/phases/08-optimization.md)
- [ ] Coupon Management (Mã giảm giá):
    - Tạo mã giảm giá: Theo % hoặc Theo số tiền cụ thể
    - Cấu hình theo: Giá trị đơn tối thiểu, Số lần sử dụng, Thời gian hết hạn
    - API/Logic apply mã khi thanh toán
- [ ] Báo cáo doanh thu chi tiết (Advanced Reports):
    - Top khách hàng trung thành
    - Trend doanh thu theo biểu đồ đường
    - Danh sách sản phẩm bán chậm (Để ra plan sale)
- [ ] SEO Level 2:
    - Sitemap XML tự động gen
    - Robots.txt
    - Schema Google (Structured data) cho Sản phẩm để chiếm Rich Snippet
- [ ] Tối ưu tốc độ (Performance):
    - Lazy load ảnh
    - Cache trang chủ, danh sách sản phẩm với Redis (Nếu cần)
    - Resize ảnh thumbnail đúng tỉ lệ

## Yêu cầu bổ sung (từ 00_recommendations_log.md)
- SHOULD: Thêm thuộc tính original_url cho ảnh SP để lưu ảnh gốc. (Cân nhắc đưa vào slice tối ưu ảnh)
- COULD: Thêm chức năng "Duplicate Product" để admin tạo nhanh. (Cân nhắc đưa vào slice Admin UI)
- MAYBE: Hỗ trợ Đa ngôn ngữ (I18n) cho tên sản phẩm/danh mục. (Out of scope for this phase unless requested)

## Cập nhật/Điều chỉnh
- 2026-04-03 11:45: Khởi tạo nhật ký theo yêu cầu của Phase 08.
