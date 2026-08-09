# REPO MAP — Bộ lọc danh mục và thông tin dinh dưỡng
- Cập nhật: 2026-07-29 10:00

## File và vai trò
- `src/modules/public/products/products.controller.js`: query, dựng cây danh mục, tổng hợp số sản phẩm theo nhóm.
- `src/views/public/products/shop.ejs`: UI bộ lọc, mở/đóng danh mục con.
- `src/views/admin/products/create.ejs`: nhập rich text dinh dưỡng khi tạo.
- `src/views/admin/products/edit.ejs`: chỉnh rich text, tương thích dữ liệu plain text cũ.
- `src/views/public/products/detail.ejs`: trình bày rich text dinh dưỡng.
- `prisma/schema.prisma`: trường `nutritional_info String? @db.Text`, không cần migration.

## Rủi ro
- Nội dung HTML do admin nhập đang dùng cùng trust model với mô tả chi tiết.
- Bộ lọc phải tiếp tục submit radio category, nút mở rộng không được submit form.
- Hover cần giữ được, nhưng click/keyboard phải dùng được trên thiết bị không có hover.
