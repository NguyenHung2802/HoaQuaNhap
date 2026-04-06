# Master Plan - Cải tiến cơ chế nhập địa chỉ WebHoaQua

## 1. Các Slice thực thi (Slices)

### Slice 1: Nền tảng Address Helper (Frontend JS)
*Mục tiêu:* Tạo Class JS dùng chung để xử lý việc nạp Tỉnh/Huyện/Xã từ API công khai.
*Hành động:*
1. Tạo tệp `public/js/address-helper.js`. (Đã hoàn thành sơ bộ).
2. Tích hợp khả năng tự động chọn (pre-select) dựa trên `data-selected` attribute.

### Slice 2: Cập nhật Giao diện Checkout (UI Tier) -> Ưu tiên cao nhất
*Mục tiêu:* Thay thế manual input bằng Select dropdown trong trang Thanh toán.
*Hành động:*
1. Sửa `src/views/public/checkout/index.ejs`: 
    - Thay thế các `input` Tỉnh/Huyện/Xã bằng `<select>`.
    - Thêm link script `address-helper.js`.
    - Khởi tạo `AddressHelper` và gắn listener để tự động update `delivery_address`.
2. Sửa lỗi "không tự động cập nhật": Đảm bảo logic JS ghép địa chỉ lắng nghe sự kiện `change` từ cả 3 dropdown.

### Slice 3: Cập nhật Giao diện Sổ địa chỉ (UI Tier)
*Mục tiêu:* Đồng bộ dropdown cho phần quản lý địa chỉ trong Profile.
*Hành động:*
1. Sửa `src/views/public/profile/index.ejs`: 
    - Cập nhật Form Modal địa chỉ sử dụng `<select>`.
    - Import và khởi tạo `AddressHelper` cho modal.
    - Cẩn trọng phần gán giá trị khi nhấn "Sửa địa chỉ" (phải gán vào `dataset.selected` và trigger load API).

## 2. Kiểm thử (Test)
- Đảm bảo chọn Tỉnh thành thì Quận/Huyện mới hiện ra tương ứng.
- Đảm bảo khi chọn đủ 3 cấp, trường "Địa chỉ đầy đủ" ở Checkout được ghép đúng.
- Đảm bảo trang Profile "Sửa địa chỉ" vẫn load lại đúng Tỉnh/Huyện/Xã cũ từ DB.
