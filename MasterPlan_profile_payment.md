# Master Plan - Cập nhật Profile & Hình thức Chuyển khoản QR

## 1. Các Slice thực thi (Slices)

### Slice 1: Cho phép cập nhật Số điện thoại (UI/API Tier)
*Mục tiêu:* Khách hàng có thể đổi SĐT của chính mình.
*Hành động:*
1. Mở khóa `input` trong `profile/index.ejs`.
2. Sửa `profile.controller.js`: Cập nhật đồng thời `User` và `Customer`. Lưu ý check `unique` (nếu SĐT mới đã thuộc về người khác thì không cho đổi).

### Slice 2: Checkout - Lựa chọn Phương thức thanh toán (UI/API Tier)
*Mục tiêu:* Thêm lựa chọn thanh toán trong trang Checkout.
*Hành động:*
1. Sửa `checkout/index.ejs`: Thêm các radio button cho "Tiền mặt khi nhận hàng" (COD) và "Chuyển khoản VietQR".
2. Cập nhật `orders.controller.js` (Method `placeOrder`): Nhận `payment_method` từ form gửi lên.

### Slice 3: Hiển thị QR Code Chuyển khoản (Success Page UI)
*Mục tiêu:* Khách chọn chuyển khoản sẽ thấy hình ảnh QR để thanh toán.
*Hành động:*
1. Bổ sung thông tin tài khoản ngân hàng vào `seed.js` hoặc cấu hình qua bảng `Setting`.
2. Sửa `orders.controller.js` (Method `renderSuccess`): 
    - Lấy cấu hình Bank từ bảng `Setting`.
    - Truyền link ảnh QR `img.vietqr.io` sang view nếu phương thức là `BANK_TRANSFER`.
3. Cập nhật `checkout/success.ejs` để hiển thị khung thông tin thanh toán & QR Code.

### Slice 4: Quản lý Thanh toán Admin (Admin Ops Tier)
*Mục tiêu:* Phân biệt đơn hàng và xác nhận thu tiền.
*Hành động:*
1. Cập nhật Order List Admin: Thêm nhãn phân biệt phương thức thanh toán.
2. Cập nhật Order Detail Admin: Thêm nút "Xác nhận đã thanh toán" cho đơn hàng `BANK_TRANSFER`.
3. Lưu lịch sử thay đổi trạng thái (Order Status Log).

## 2. Kiểm thử (Test)
- Đổi SĐT thành công và login lại được với SĐT mới (nếu hệ thống dùng SĐT login, cần kiểm tra Email có đổi theo không nếu chung email).
- Đặt đơn BANK_TRANSFER và kiểm tra link QR có đúng mã đơn và số tiền không.
- Admin xác nhận thanh toán thành công.
