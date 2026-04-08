# KẾ HOẠCH NÂNG CẤP HỆ THỐNG LIÊN HỆ & THEO DÕI TRUY CẬP (PHASE 9)

## 1. Phân tích Yêu cầu (Business Analysis)

### 1.1 Popup Liên Hệ Gọn Nhẹ & Thông Minh
*   **Vấn đề hiện tại:** Trang web thiếu điểm chạm nhanh khiến khách hàng ngại tìm đến trang Liên hệ truyền thống.
*   **Giải pháp:** 
    *   Tạo một **Floating Icon** (Biểu tượng nổi) ở góc dưới màn hình.
    *   Khi click sẽ mở ra một mini-form với thiết kế hiện đại, tinh gọn.
    *   **Trường bắt buộc:** Tên, Số điện thoại, Nhu cầu (bằng dropdown gợi ý sẵn + nhập tay).
    *   **Trường mở rộng:** Nút "Thêm thông tin" -> Click vào mới trượt xuống (accordion) hiện ô Email.
*   **Xử lý Dữ liệu:** Khi khách hàng gửi, ngay lập tức lưu vào Database và hiển thị trên màn hình Admin. Có thể gắn thêm hệ thống gửi Email thông báo tự động (Nodemailer) cho Chủ shop để không lỡ khách.

### 1.2 Nhận thức hệ thống theo dõi nội bộ vs Bên thứ 3 (3rd Party)
Khách hàng có hỏi về việc có nên tự làm (Natively) các form và script theo dõi giống như một số hệ thống SaaS hay không.
*   **Quan điểm của AI:**
    *   **A. Về Form/Popup Liên hệ:** Chúng ta **HOÀN TOÀN NÊN TỰ LÀM**. Việc nhúng mã JS của bên thứ 3 (như Tawk.to, Subiz) thường làm chậm website (tải thêm 2-3MB JS) và bị kiểm soát data. Tự code bằng Bootstrap/JS tĩnh sẽ nhanh hơn gấp 10 lần, nhẹ website và Database hoàn toàn thuộc quyền sở hữu của bạn.
    *   **B. Về Tracking Lượng Truy Cập / Click / Real-time:** 
        *   **Tự code:** Có thể làm được (ví dụ đếm số lượt xem chi tiết từng mã sản phẩm, số lần click vào nút mua). **Nhược điểm nặng nề:** Nếu website bạn có 10,000 lượt truy cập/tháng, database của bạn sẽ bị "phình to" rác log truy cập cực kì nặng, làm chậm toàn bộ thao tác mua bán.
        *   **Sử dụng Google Analytics 4 (GA4):** Đây là hệ thống chuyên dụng, miễn phí từ Google. GA4 cung cấp Real-time (số người đang online), vị trí địa lý, độ tuổi, tỷ lệ thoát trang.
*   **=> Quyết định:** 
    1. **Tự lập trình** Toàn bộ giao diện Popup, Form, Lưu trữ thông tin khách hàng tiềm năng nội bộ.
    2. **Tự lập trình** đếm lượt xem (View) tĩnh ở mức độ "Lượt Clicks cho Sản Phẩm" để tính độ Hot.
    3. **Tích hợp Google Analytics 4** cho việc báo cáo "Lượng người hiện tại đang ở trên web" và biểu đồ truy cập tổng thể để tối ưu Server.

---

## 2. Kế hoạch triển khai Kỹ thuật (Implementation Plan)

### Slice 1: Database & Backend Core (Quản trị Lead)
*   **Mục tiêu:** Tạo kho lưu trữ thông tin liên hệ.
*   **Công việc:**
    1.  Cập nhật file `schema.prisma`: Thêm model `ContactRequest`.
        ```prisma
        model ContactRequest {
            id          Int      @id @default(autoincrement())
            name        String
            phone       String
            need        String   // Gợi ý nhu cầu mua
            email       String?  // Optional
            status      String   @default("new") // new, processing, resolved
            source_url  String?  // Khách đang đứng ở trang nào khi gửi
            created_at  DateTime @default(now())
        }
        ```
    2.  Tạo Controller & Route: `POST /api/contacts` để nhận dữ liệu từ Frontend AJAX.
    3.  Tạo trang Quản trị trong Admin (`/admin/contacts`) để bạn xem thông tin khách, gọi điện và chuyển trạng thái "Đã liên hệ".

### Slice 2: Frontend Interactive Popup & Form
*   **Mục tiêu:** Trải nghiệm người dùng mượt mà, tiện lợi.
*   **Công việc:**
    1.  Hiệu chỉnh HTML/CSS cho **Floating Message Action Button** (Nút nổi).
    2.  Lập trình Popup UI:
        *   Ô tên, sđt, text/dropdown nhu cầu.
        *   Nút "Nhập Email (Tuỳ chọn)" dạng ẩn/hiện.
    3.  Javascript AJAX: Submit form ngầm, tắt popup và hiện thông báo cảm ơn (sweetalert/toast) mà **không tải lại trang**.
    4.  *(Tuỳ chọn mở rộng định thời)* Gắn vào webhook chat Telegram hoặc Email (để điện thoại bạn rung lên ngay khi có người điền form).

### Slice 3: Hệ thống Analytics Cơ bản & Tích hợp GA
*   **Mục tiêu:** Theo dõi dữ liệu khách hàng.
*   **Công việc:**
    1.  Trong Admin Dashboard: Hiển thị thống kê nhanh "Số lượng Yêu cầu liên hệ mới trong ngày".
    2.  Bổ sung chức năng đếm view ảo (Fake Views/Real Views tăng dần) trên danh sách sản phẩm.
    3.  Cấu hình Google Analytics Script.

### Slice 4: Hệ thống Cảnh báo Thời gian thực (Notifications)
*   **Mục tiêu:** Tăng tốc độ Rep khách (Lead Response Time) thông qua thông báo đa kênh miễn phí.
*   **Công việc (Chạy ngầm - Background Tasks):**
    1.  Tích hợp `Nodemailer`: Gửi báo cáo thông tin Liên hệ (Tên, SĐT, Nhu cầu) về Admin Email ngay khi khách điền form.
    2.  Tích hợp logic gọi API API Telegram Bot: Bắn Notification ngay lập tức về điện thoại của chủ web/nhóm sale.

---
**Trạng thái mong đợi:** Kế hoạch đã chốt. Chuẩn bị tiến hành Slice 1.
