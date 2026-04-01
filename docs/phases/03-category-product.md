# Giai đoạn 3 — Quản lý danh mục và sản phẩm

## Mục tiêu
Cho phép admin quản lý danh sách sản phẩm và danh mục hoa quả.

## Việc cần làm
- [ ] CRUD categories (Danh mục) - có hiển thị hình ảnh
- [ ] CRUD products (Sản phẩm) - quản lý thông tin SKU, Giá, Xuất sứ, Đơn vị tính
- [ ] Upload nhiều ảnh cho sản phẩm và resize bằng Cloudinary
- [ ] Thiết lập trạng thái Publish / Hide (Ẩn/Hiện) sản phẩm
- [ ] Quản lý tồn kho ban đầu (số lượng trong kho)
- [ ] Danh sách sản phẩm admin với bộ lọc, tìm kiếm
- [ ] Tạo module `inventory` để ghi log nhập kho cơ bản

## Kết quả đầu ra
- Giao diện admin có thể quản lý, chỉnh sửa sản phẩm một cách mượt mà
- Toàn bộ dữ liệu được lưu trữ trong Database thông qua Prisma
- Có hình ảnh sản phẩm được lưu trên Cloudinary
- Hệ thống sẵn sàng với dữ liệu mẫu (Seeding)
- Slug sản phẩm sinh tự động
