# NHẬT KÝ YÊU CẦU — Giai đoạn 3: Quản lý danh mục và sản phẩm
- Ngày tạo: 2026-04-02 10:15

## Yêu cầu gốc
Tiến hành thực hiện giai đoạn 3 của dự án WebHoaQua.
Mục tiêu: Cho phép admin quản lý danh sách sản phẩm và danh mục hoa quả.

Các việc cần làm (theo docs/phases/03-category-product.md):
- CRUD categories (Danh mục) - có hiển thị hình ảnh.
- CRUD products (Sản phẩm) - quản lý thông tin SKU, Giá, Xuất sứ, Đơn vị tính.
- Upload nhiều ảnh cho sản phẩm và resize bằng Cloudinary.
- Thiết lập trạng thái Publish / Hide (Ẩn/Hiện) sản phẩm.
- Quản lý tồn kho ban đầu (số lượng trong kho).
- Danh sách sản phẩm admin với bộ lọc, tìm kiếm.
- Tạo module `inventory` để ghi log nhập kho cơ bản.

Kết quả đầu ra:
- Giao diện admin quản lý sản phẩm mượt mà.
- Dữ liệu lưu trong DB qua Prisma.
- Hình ảnh lưu trên Cloudinary.
- Có dữ liệu mẫu (Seeding).
- Slug sản phẩm sinh tự động.

## Cập nhật/Điều chỉnh
- 2026-04-02 10:15: Khởi tạo BA cho Giai đoạn 3.
