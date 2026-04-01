# Giai đoạn 5 — Giỏ hàng và đặt hàng (COD)

## Mục tiêu
Cho phép khách hàng chọn mua sản phẩm và tạo đơn hàng đơn giản (không thanh toán online).

## Việc cần làm
- [ ] Cart management (Giỏ hàng):
    - Dùng Cart Session (hoặc cart DB nếu khách đã login)
    - Thêm / Cập nhật / Xóa sản phẩm khỏi giỏ hàng
    - Tính toán Tạm tính, Tổng tiền
    - Mini-cart ở header (Hover hoặc Offcanvas)
- [ ] Checkout page (Trang thanh toán):
    - Form nhập thông tin khách hàng: Tên, SĐT, Địa chỉ, Email (không bắt buộc)
    - Phương thức thanh toán: Mặc định COD (Thanh toán khi giao hàng)
    - Note đơn hàng
- [ ] Order Creation (Tạo đơn):
    - Hệ thống tạo mã đơn hàng (Order Code) duy nhất
    - Lưu Snapshot giá sản phẩm tại thời điểm mua (Tránh bị sai lệch doanh thu về sau)
    - Giảm số lượng tồn kho của sản phẩm khi đơn được xác nhận (hoặc tạo tùy cấu hình)
- [ ] Trang thành công (Success page) sau khi đặt hàng

## Kết quả đầu ra
- Khách hàng có thể thực hiện một quy trình mua sắm từ đầu đến cuối một cách mượt mà.
- Admin nhận được thông tin đơn hàng mới trong cơ sở dữ liệu
- Hệ thống gửi email thông báo (Nếu có thể, thông thường để phase marketing)
- Xóa giỏ hàng sau khi checkout thành công
