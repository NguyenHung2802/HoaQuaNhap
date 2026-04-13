# Master Plan - Nâng cấp Visuals & Trải nghiệm Cao cấp (Phase 8.5A)

## Mục tiêu
Tập trung nguồn lực duy nhất vào việc tối ưu hóa Frontend (EJS Views, CSS, Vanilla JS) nhằm nâng cấp WebHoaQua để có một diện mạo chuẩn "E-Commerce xịn", không can thiệp hay sửa đổi logic backend phức tạp làm ảnh hưởng đến mã nguồn chạy tốt hiện tại.

## Danh sách công việc (Work Breakdown)

### Task 1: Tích hợp siêu Animation với AOS (A1)
- Bổ sung CDN CSS/JS của AOS library trực tiếp vào `<head>` và trước `</body>` trong `src/views/layouts/main.ejs`.
- Khởi tạo cấu hình mặc định `AOS.init({ once: true, offset: 100 })` tại `public/js/main.js`.
- Rải các class `data-aos="fade-up"` (và các khoảng trễ delay) tại giao diện liệt kê danh sách như Sản phẩm (`fruit-card`), Bài viết (`blog-card`).

### Task 2: Tối ưu Toasts Notifications góc màn hình (A2)
- Chỉnh sửa file `src/views/partials/flash.ejs`. Mặc dù vẫn nhận biến locals `success_msg`, `error_msg`, nhưng thay vì in ra DOM Bootstrap Alert HTML, chúng ta sẽ in vào bên trong thẻ `<script>` dưới dạng:
  ```javascript
  const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000
  });
  Toast.fire({ icon: 'success', title: '<%= success_msg %>' });
  ```
- Nâng cấp trải nghiệm không giới hạn gián đoạn giao diện của người mua hàng.

### Task 3: CSS Tinh Gọn & Hover sâu sắc (A3)
- Cập nhật trực tiếp file `public/css/style.css`.
- Cải thiện biến chuyển của `.fruit-card`, làm shadow toả mềm (blur lớn hơn, opacity thấp hơn: e.g. `rgba(0,0,0,0.05)` thay vì `0.08`).

### Task 4: Trải nghiệm App với Mobile Bottom Nav (A4)
- Viết file `src/views/partials/mobile-bottom-nav.ejs` mô phỏng thanh điều hướng 4 nút theo chuẩn UI di động.
- Viết đoạn CSS media queries `@media (max-width: 768px)` vào `style.css` để ấn định thanh này dính đáy, background màu trắng, shadow hướng lền.
- Đổi thuộc tính padding đáy của thẻ `<main>` trên mobile để nội dung cuối trang không bị thanh Bar đè lấp.
- Cập nhật `main.ejs` để `<%- include('../partials/mobile-bottom-nav') %>` hiển thị.

## Lưu ý kỹ thuật & Safety
Luôn giữ sao lưu cấu trúc file hoặc không xoá toàn bộ code cũ nếu không cần thiết, thiết kế dựa trên Framework Bootstrap 5 đang cực kỳ ổn định.
