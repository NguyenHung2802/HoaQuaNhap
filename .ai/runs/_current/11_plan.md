# KẾ HOẠCH NÂNG CẤP CHUYÊN SÂU & GIỮ CHÂN KHÁCH HÀNG (PHASE 11)

Dựa trên kết quả phân tích BA được chốt, Phase 11 sẽ tiến hành triển khai 5 TÍNH NĂNG MỚI ĐÃ THẢO LUẬN + 1 HẠNG MỤC CÒN TỒN ĐỌNG (Contact Popup UI Phase 9). Mục tiêu là tạo ra sự tiện lợi tối đa cho khách hàng và tăng tỷ lệ hiển thị sales.

Vì khối lượng công việc đáng kể, chúng ta sẽ chia tài liệu này làm **6 Lát Cắt (Slices)** đi theo trục dọc (Vertical Slice: Database -> API -> UI) để thực thi dễ dàng, chắc chắn và test sau mỗi slice.

---

## MASTER PLAN (DANH SÁCH SLICE)

### Slice 1: Hoàn thiện Phase 9 (Frontend Component Popup Liên hệ)
*   **Mục tiêu:** Khách hàng không cần nhảy sang trang `/contact` mà có thể điền ngay Form nổi góc trái/phải màn hình.
*   **Công việc:**
    1. Thiết kế EJS Component (`contact-popup.ejs`) dạng Modal bật lên.
    2. Viết CSS dạng chat widget icon, hover hiện ra, bấm lên trượt Modal.
    3. JS sử dụng fetch/AJAX đẩy về `POST /api/contacts` (Logic này đã code xong).

### Slice 2: Tính năng Tra cứu Đơn hàng cho Khách vãng lai (Guest Tracking)
*   **Mục tiêu:** Công cụ tự kiểm tra đơn hàng nhanh gọn.
*   **Công việc:**
    1. Tạo Route: `GET /track-order` & `POST /track-order`.
    2. Controller: Lấy thông tin dựa theo phép khớp { phone, order_code } kết hợp `prisma.order.findFirst()`.
    3. UI (View): Trang giao diện mới gọn gàng với thanh Timeline trạng thái đơn hàng.

### Slice 3: Plugin Flash Sale Khung Giờ Vàng (Thúc đẩy Doanh Thu)
*   **Mục tiêu:** Kích thích mua hàng với số lượng lớn trong thời gian thực.
*   **Công việc:**
    1. DB Schema: Bổ sung trường cho `Product` model: `is_flash_sale` (Boolean), `flash_sale_price`, `flash_sale_end` (DateTime).
    2. Admin CMS: Cho phép set sản phẩm làm Flash sale ở màn Add/Edit Product.
    3. Public Site: Đẩy sản phẩm Flashsale lên mục riêng ở `Homepage` kết hợp với Javascript đếm ngược CountDown (dd:hh:mm:ss).

### Slice 4: Gợi ý Sản phẩm Liên Quan / Mua Cùng (Cross-Selling)
*   **Mục tiêu:** Gia tăng giá trị trung bình trên một giỏ hàng (AOV).
*   **Công việc:**
    1. Tại Product Detail: Bổ sung truy vấn 4-8 sản phẩm cùng danh mục phân phối random. (Render ra View).
    2. Tại Trang Cart (Giỏ hàng): Thuật toán đếm để tính "Bạn cần mua thêm X đồng nữa để Freeship" (nếu thiết lập) và đẩy ra 2 SP phù hợp (Như loại nhỏ 100k, 200k).

### Slice 5: Membership & Loyalty Points (Tích luỹ Quả Dâu)
*   **Mục tiêu:** Thưởng cho khách quen có tài khoản đăng nhập khi đã Checkout thành công.
*   **Công việc:**
    1. DB Schema: Thêm cột `reward_points` vào bảng `User`. Thêm bảng `PointHistory` (Log cộng trừ).
    2. Đổi Logic Checkout: Khách mua thành công 1 đơn -> Ghi nhận points = 1% giá trị.
    
    3. Đổi Logic Cart/Checkout: Nút "Bạn có [N] điểm, đổi để giảm N VND?" (Quy đổi 1Đ = 1.000VND). Cập nhật tổng tiền khi sử dụng điểm.

### Slice 6: Worker Tự Động Sao Lưu Dữ Liệu (Auto Backup)
*   **Mục tiêu:** An toàn thông tin kinh doanh.
*   **Công việc:**
    1. Sử dụng thư viện `node-cron` chạy ngầm.
    2. Thực thi Child Process gọi CMD `pg_dump`.
    3. Zip và đẩy file ra thư mục `backups/` định kỳ 2h sáng mỗi ngày, xoá dòng backup sau 30 ngày.

---
**=> Yêu cầu tiếp theo:** Chốt tiến hành `/implement` theo từng Slice, ưu tiên Slice 1 và Slice 2 trước.
