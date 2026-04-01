# Tiêu chuẩn hoàn thành & Kiểm thử (DoD & Testing)

## 1. Tiêu chuẩn hoàn thành MVP (Definition of Done)

Một tính năng được coi là hoàn thành khi đáp ứng các tiêu chuẩn sau:

- **Mã nguồn**: Code sạch (theo Clean Code), không có biến dư thừa, comment đầy đủ cho các hàm nghiệp vụ phức tạp.
- **Database**: Schema đã được cập nhật, migration đã chạy thành công.
- **Giao diện**: Hiển thị đúng thiết kế (Layout, Spacing, Color), Responsive tốt trên Mobile.
- **Tính năng**: Chạy đúng luồng nghiệp vụ đã đặc tả trong tài liệu BA.
- **Bảo mật**: Admin route phải được bảo vệ, mật khẩu được hash, input được validate bằng Zod/Joi.
- **Kiểm thử**: Đã chạy thử các case chính (Happy path) và các case lỗi (Edge cases) thành công.

## 2. Kế hoạch kiểm thử chi tiết

### 2.1. Kiểm thử chức năng (Functional Testing)
- **Luồng Admin**:
    - Đăng nhập/Đăng xuất thành công.
    - CRUD Danh mục & Sản phẩm (bao gồm upload ảnh).
    - Cập nhật trạng thái đơn hàng và trừ tồn kho tương ứng.
- **Luồng Public**:
    - Hiển thị danh sách sản phẩm & Chi tiết sản phẩm.
    - Tìm kiếm và lọc sản phẩm (Filter/Search).
    - Thêm vào giỏ hàng và đặt hàng thành công.

### 2.2. Kiểm thử logic dữ liệu
- **Snapshot Giá**: Kiểm tra xem khi giá sản phẩm thay đổi, giá trong các đơn hàng cũ có bị đổi theo không (Phải giữ nguyên giá lúc mua).
- **Tồn kho**: Kiểm tra khả năng ngăn chặn đặt hàng khi hết hàng (Out of stock).
- **Hoàn tồn**: Khi hủy đơn hàng, số lượng tồn kho phải được cộng lại chính xác.

### 2.3. Kiểm thử giao diện & Trải nghiệm (UI/UX)
- Kiểm tra hiển thị trên Chrome, Safari và Mobile view.
- Kiểm tra các trạng thái Loading, Empty (không có sản phẩm), và thông báo lỗi (Flash messages).

## 3. Quy trình Triển khai (Deployment)
- Sử dụng **PM2** để duy trì process.
- Cấu hình **Nginx** làm Proxy ngược.
- SSL phải được kích hoạt (HTTPS).
- Sao lưu Database (Dump SQL) định kỳ.
