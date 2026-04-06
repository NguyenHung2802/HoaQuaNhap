# BA - Cải tiến Profile & Tích hợp Thanh toán Chuyển khoản QR

## 1. Yêu cầu (Requirements)
- **Cho phép sửa Số điện thoại**: Hiện tại SĐT đang bị khóa trong Profile. Khách hàng cần cập nhật được SĐT mới. Cần lưu ý việc cập nhật này phải áp dụng cho cả bảng `User` và `Customer`.
- **Phương thức thanh toán Chuyển khoản (VietQR)**:
    - Bổ sung lựa chọn "Chuyển khoản ngân hàng" tại trang Checkout.
    - Tự động tạo mã QR Code (VietQR) tại trang thông báo đặt hàng thành công.
    - Nội dung QR bao gồm: Mã đơn hàng, Số tiền cần thanh toán (Sau khi trừ giảm giá).
    - Trạng thái thanh toán ban đầu: `pending`.
- **Quản lý thực thu (Admin)**:
    - Admin cần phân biệt được đơn nào là COD, đơn nào là Chuyển khoản.
    - Admin có quyền xác nhận "Đã thanh toán" thủ công sau khi kiểm tra tài khoản ngân hàng.

## 2. Phạm vi (Scope)
- **View Hồ sơ (`profile/index.ejs`)**: Mở khóa trường Số điện thoại.
- **Controller Hồ sơ (`profile.controller.js`)**: Cập nhật logic để đổi SĐT ở cả 2 bảng.
- **View Thanh toán (`checkout/index.ejs`)**: Thêm Option chọn hình thức thanh toán.
- **View Thành công (`checkout/success.ejs`)**: Hiển thị thông tin chuyển khoản & QR code.
- **Admin Order Detail**: Thêm nút xác nhận thanh toán.

## 3. Phân tích kỹ thuật (Technical Analysis)
- **VietQR API**: `https://img.vietqr.io/image/<BANK_ID>-<ACCOUNT_NO>-<TEMPLATE>.png?amount=<AMOUNT>&addInfo=<INFO>&accountName=<NAME>`.
- **Cấu hình ngân hàng**: Lưu trong bảng `Setting` với prefix `bank_`.
- **Quy trình đơn hàng**:
    - COD: `order_status: pending`, `payment_status: pending`.
    - Chuyển khoản: `order_status: pending`, `payment_status: pending`. Sau khi admin nhấn xác nhận -> `payment_status: paid`.
