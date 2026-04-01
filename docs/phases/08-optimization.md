# Giai đoạn 8 — Voucher, báo cáo doanh thu và hệ thống nâng cao

## Mục tiêu
Tăng tỷ lệ khách mua lại và báo cáo chi tiết cho bộ phận quản lý.

## Việc cần làm
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

## Kết quả đầu ra
- Website chuyên nghiệp, có công cụ giữ chân khách hàng (Retention)
- Báo cáo rõ ràng đẩy đủ số liệu cho người quản lý nắm bắt tình hình kinh doanh
- Website đạt điểm SEO đánh giá tốt trên Search Console
