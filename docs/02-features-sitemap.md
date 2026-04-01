# Chức năng và Site Map

## 1. Cấu trúc chức năng tổng quát

### 1.1. Nhóm chức năng public site
- **Trang chủ**: Banner chính, Sản phẩm nổi bật, Sản phẩm mới, Sản phẩm bán chạy, Combo / quà biếu, Giới thiệu thương hiệu ngắn, Chính sách nổi bật, Feedback khách hàng, CTA mua hàng, Liên hệ nhanh
- **Trang danh mục**: Danh sách sản phẩm, Bộ lọc, Sắp xếp, Phân trang
- **Trang chi tiết sản phẩm**: Tên sản phẩm, Ảnh, Giá, Xuất xứ, Khối lượng / quy cách, Mô tả ngắn, Mô tả chi tiết, Tình trạng còn hàng, Nút thêm giỏ hàng / mua ngay, Sản phẩm liên quan, Đánh giá khách hàng
- **Giỏ hàng**: Danh sách sản phẩm đã chọn, Số lượng, Cập nhật / xóa, Tạm tính, Mã giảm giá (sau này), Phí giao hàng (sau này)
- **Đặt hàng**: Tên người nhận, Số điện thoại, Địa chỉ, Ghi chú, Phương thức thanh toán, Xác nhận đặt hàng
- **Các trang nội dung**: Giới thiệu, Liên hệ, Chính sách giao hàng, Chính sách đổi trả, Chính sách bảo quản, FAQ, Blog / tin tức

### 1.2. Nhóm chức năng admin
- **Dashboard**: Tổng đơn hàng, Doanh thu, Đơn mới, Sản phẩm sắp hết hàng, Top sản phẩm bán chạy, Thống kê đơn theo thời gian
- **Quản lý sản phẩm**: Thêm / Sửa / Ẩn sản phẩm, Quản lý giá, Quản lý ảnh, Quản lý tồn kho, Tags / danh mục
- **Quản lý danh mục**: Thêm / sửa / xóa / sắp xếp danh mục, Hiển thị menu
- **Quản lý đơn hàng**: Danh sách đơn, Chi tiết đơn, Cập nhật trạng thái, Ghi chú nội bộ, Lọc đơn theo trạng thái
- **Quản lý khách hàng**: Danh sách khách hàng, Lịch sử mua hàng, Địa chỉ, Tổng giá trị đã mua
- **Quản lý kho**: Số lượng tồn, Lịch sử nhập / xuất, Cảnh báo sắp hết hàng
- **Quản lý nội dung**: Banner trang chủ, Bài viết blog, Nội dung giới thiệu, Chính sách, FAQ
- **Quản lý khuyến mãi**: Voucher, Chương trình sale, Combo, Freeship
- **Báo cáo**: Doanh thu (ngày / tuần / tháng), Đơn hàng theo trạng thái, Top sản phẩm, Tồn kho, Tỷ lệ hủy đơn

## 2. Tính năng theo ưu tiên (MVP vs Giai đoạn sau)

### 2.1. Tính năng bắt buộc cho MVP
- Trang chủ, Danh mục sản phẩm, Chi tiết sản phẩm, Tìm kiếm cơ bản, Lọc cơ bản, Giỏ hàng, Đặt hàng COD, Quản lý sản phẩm, Quản lý danh mục, Quản lý đơn hàng, Quản lý tồn kho, Dashboard cơ bản, Quản lý banner / nội dung cơ bản, Đăng nhập admin

### 2.2. Tính năng nên có sớm sau MVP
- Review / đánh giá, Wishlist, Voucher, Blog, SEO tối ưu, Responsive mobile tốt, Báo cáo chi tiết hơn, Quản lý nhà cung cấp, Quản lý nhập hàng, Gợi ý sản phẩm liên quan

### 2.3. Tính năng nâng cao
- Thanh toán online, Loyalty / điểm thưởng, Khách hàng VIP, Abandoned cart, Remarketing, CRM, AI gợi ý sản phẩm, Phân tích hành vi, Multi-admin role, Audit log chi tiết, Đa chi nhánh / đa kho

## 3. Site Map đề xuất

### 3.1. Public site
- `/`, `/products`, `/products/:slug`, `/categories/:slug`, `/cart`, `/checkout`, `/order-success`, `/track-order`, `/about`, `/contact`, `/blog`, `/blog/:slug`, `/policy/*`, `/faq`

### 3.2. Admin site
- `/admin/login`, `/admin`, `/admin/products`, `/admin/products/create`, `/admin/products/:id/edit`, `/admin/categories`, `/admin/orders`, `/admin/orders/:id`, `/admin/customers`, `/admin/inventory`, `/admin/banners`, `/admin/blog`, `/admin/reviews`, `/admin/coupons`, `/admin/reports`, `/admin/settings`
