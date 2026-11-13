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
- 2026-08-10 12:00: Admin được chọn một danh mục chính và nhiều danh mục bổ sung cho sản phẩm; dữ liệu cũ phải được backfill an toàn; bổ sung tài liệu migrate để triển khai lại trên môi trường nhận code.
- 2026-04-03 11:45: Khởi tạo nhật ký theo yêu cầu của Phase 08.

## Cập nhật 2026-07-29 10:00 — UI danh mục con và dinh dưỡng
- Trong bộ lọc sản phẩm, cần có dấu hiệu luôn hiển thị để biết danh mục cha có mục con, không phụ thuộc hover.
- Làm phần thông tin dinh dưỡng ở cả admin và public đẹp, trực quan và tương tự mô tả chi tiết.
- Phạm vi chốt: chevron + số mục con + tổng sản phẩm nhóm; Quill rich text + tương thích plain text cũ; không đổi DB/API.

## Cập nhật 2026-11-12 — Nâng cấp giao diện, API đăng bài, Tin tức ẩn (BA v9)
Yêu cầu gốc (nguyên văn rút gọn):
- Giao diện: trực quan, bắt mắt, có animation, logic hoạt động, kiểu công nghệ hiện đại nhưng vẫn giữ bản chất web hoa quả; có thể thiết kế lại bố cục; admin chỉ sửa nếu logic công khai thay đổi.
- API đăng bài cho n8n: nhận nội dung, ảnh, video; mặc định nháp, có tham số đăng ngay; áp dụng cho cả blog công khai và tin ẩn.
- Tin tức ẩn: URL dạng `/tin-tuc/{dd-mm-yyyy}/{slug không dấu}/{mã base64}`; không hiển thị link ở đâu trên web; vào bằng link có sẵn; kèm popup quảng cáo affiliate Shopee/TikTok.
Điều chỉnh đã chốt:
- Popup: lớn; bấm thân popup/CTA mở link tab mới + đóng; X và nền mờ chỉ đóng (không bẫy click). Hiện lại mỗi lần tải trang.
- Link affiliate theo bài, dự phòng link mặc định; subdomain tách riêng (`tin.haianhfruit.com`); có thống kê; video ưu tiên link nhúng.
- Hạ tầng: VPS 1 vCPU/1GB RAM/20GB SSD; n8n chạy chung tại subdomain `n8n.`; gọi API qua localhost.
- Giao diện: làm 3 bản mẫu để chọn.
Loại bỏ: nút X khó bấm / bấm ngoài X mở link (2026-11-12, lý do: click lừa, rủi ro chính sách affiliate).

## Cập nhật 2026-11-12 — Chốt giao diện
- Chọn phương án C (Editorial). Yêu cầu bổ sung: tông sáng, nền trắng, sang trọng và sạch; có animation, hiệu ứng click, lướt, xem sản phẩm mượt mà chuyên nghiệp; không được làm giao diện trông tệ hơn bản cũ; lưu ý bố cục cũ.
- Phản hồi: giữ bộ khung và nhận diện cũ, bản mẫu C2 nền trắng đã dựng (`docs/mockups/mau-c2-nen-trang.html`).
