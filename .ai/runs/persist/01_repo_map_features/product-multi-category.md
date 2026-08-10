# REPO MAP — Sản phẩm nhiều danh mục
- Cập nhật: 2026-08-10 12:00

## Mục tiêu
Cho phép một sản phẩm có một danh mục chính và nhiều danh mục bổ sung mà không mất dữ liệu cũ.

## Thành phần
- `prisma/schema.prisma`: model `ProductCategory`.
- `prisma/migrations/20260810120000_add_product_categories/migration.sql`: tạo bảng và backfill.
- `src/modules/products/`: CRUD, filter và duplicate phía admin.
- `src/views/admin/products/`: chọn/hiển thị nhiều danh mục.
- `src/modules/public/products/`: filter, count và related products.
- `src/modules/public/home/`, `cart/`, `checkout/`: tải relation để định giá đúng.
- `src/modules/promotions/`, `src/utils/promotion-helper.js`: khớp bất kỳ danh mục nào.

## Rủi ro
- Prisma Client phải được generate sau khi migrate.
- Không được xóa `Product.category_id` khi còn dùng làm danh mục chính.
- Query nhiều điều kiện phải dùng `AND` bọc `OR` danh mục để không ghi đè điều kiện tìm kiếm.
