# Giai đoạn 6 — Quản lý đơn hàng và Dashboard admin

## Mục tiêu
Cho phép admin quản lý và theo dõi hiệu quả bán hàng.

## Việc cần làm
- [ ] Order Listing (Danh sách đơn):
    - Hiển thị danh sách đơn theo thời gian
    - Phân lọc theo Trạng thái (Pending, Processing, Shipping, Completed, Cancelled)
    - Tìm kiếm theo Mã đơn, SĐT khách
- [ ] Order Detail (Chi tiết đơn):
    - Xem thông tin khách, địa chỉ giao hàng, danh sách sản phẩm đã mua
    - Cập nhật trạng thái đơn (Bước này là nhân tố then chốt cho quản lý vận hành)
    - Log lịch sử trạng thái của từng đơn
- [ ] Product Dashboard (Thống kê sơ bộ):
    - Doanh thu theo Ngày / Tuần / Tháng
    - Sản phẩm sắp hết hàng (Cảnh báo tồn kho thấp)
    - Top 5 sản phẩm bán chạy nhất (Best Sellers)
- [ ] Inventory Management (Quản lý kho):
    - Danh sách tồn kho theo sản phẩm
    - Lịch sử Nhập / Xuất kho (Đơn hàng trừ tồn khi xác nhận / Trả tồn khi hủy)

## Kết quả đầu ra
- Website đã ở trạng thái vận hành được (Operational state).
- Admin có thể thực hiện kiểm đơn, xuất đơn và thống kê hiệu quả
- Có biểu đồ (Chart.js) đơn giản ở trang chủ admin
