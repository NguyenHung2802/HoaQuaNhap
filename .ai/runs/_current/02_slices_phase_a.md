# Workflow Slices - Phase A Tối Ưu UI/UX

Công việc Frontend mang tính gắn kết cao và tập trung vào các Layout EJS tĩnh/Styles, nên kế hoạch sẽ được gộp lại thành 1 Slice duy nhất để triển khai cho tiện.

## Slice 1: Premium Frontend Upgrade (A1, A2, A3, A4)

**Mục tiêu Slice:** Mọi cải tiến Visuals và UI Mobile xuất hiện ngay lập tức sau cấu hình.

**Danh sách File tham chiếu / sửa đổi:**
1. Thay đổi Layout Chính:
   - `src/views/layouts/main.ejs` -> Thêm thư viện AOS, nhúng `mobile-bottom-nav`, thêm padding.
2. Các View Partials:
   - `src/views/partials/flash.ejs` -> Sửa toàn tộ logic Alert sang JS SweetAlert2.
   - `src/views/partials/mobile-bottom-nav.ejs` -> (Tạo Mới) UI thẻ điều hướng.
3. Tài sản tĩnh (Public Assets):
   - `public/css/style.css` -> Cài đặt CSS Hover, Drop-shadow mượt theo class, tạo class cho `app-bottom-nav`.
   - `public/js/main.js` -> Init `AOS.init()` và setup vài util cơ bản.

**Điều kiện nghiệm thu (Acceptance Criteria):**
- Tải trang Home.ejs thấy các khối nội dung đẩy nhẹ (fade-up).
- Đăng nhập sai / Thêm sp -> Thấy Toast nổi ở góc phải trên cùng.
- Mở F12 Responsive Mobile -> Thấy thanh điều hướng cố định dưới đáy (App Navigation bar).

---
*(Trạng thái: Sẵn sàng Implement. Vui lòng phản hồi để chạy quá trình Implement)*
