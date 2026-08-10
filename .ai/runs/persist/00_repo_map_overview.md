# REPO MAP TỔNG QUAN — WebHoaQua
- Cập nhật: 2026-07-29 10:00
- Phạm vi index: UI lọc sản phẩm và nội dung sản phẩm

## Cấu trúc liên quan
- `src/modules/public/products/`: truy vấn danh sách/chi tiết sản phẩm và dựng cây danh mục.
- `src/modules/products/`: CRUD sản phẩm phía admin.
- `src/views/public/products/`: trang cửa hàng và chi tiết sản phẩm.
- `src/views/admin/products/`: form tạo/sửa sản phẩm.
- `public/css/`: style dùng chung; các trang sản phẩm hiện có thêm style cục bộ.
- `prisma/schema.prisma`: `Category.parent_id`, `Product.nutritional_info`.

## Luồng chính
1. Controller public tải danh mục đang hoạt động và `_count.products`.
2. Controller dựng cây cha/con rồi truyền sang `shop.ejs`.
3. Admin lưu mô tả và dinh dưỡng vào trường Text của Product.
4. Trang chi tiết render nội dung rich text trong tab tương ứng.

## Cấu hình và entrypoint
- `src/server.js` → `src/app.js` → `src/routes/web.route.js` / `src/routes/admin.route.js`.
- EJS + Bootstrap 5; Quill 1.3.6 được nạp từ CDN trong form sản phẩm.

## Feature maps
- `.ai/runs/persist/01_repo_map_features/product-filter-and-nutrition-ui.md`
- `.ai/runs/persist/01_repo_map_features/product-multi-category.md`

## Cập nhật 2026-08-10 — Product Multi-category
- `Product.category_id` là danh mục chính tương thích ngược.
- `ProductCategory` lưu toàn bộ quan hệ nhiều-nhiều.
- Luồng bị ảnh hưởng: Admin Product, public listing/detail/home/cart, promotion và checkout.
