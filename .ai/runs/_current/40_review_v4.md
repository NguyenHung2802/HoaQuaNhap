# Review v4 — Product Multi-category
- Timestamp: 2026-08-10 12:00
- Kết luận: SHIP WITH ENVIRONMENT FOLLOW-UP.

```text
ITEM                                  STATUS   EVIDENCE
Giữ dữ liệu/danh mục chính cũ         DONE     additive migration + backfill 0 missing
Admin chọn nhiều danh mục             DONE     create.ejs/edit.ejs + products.service
Public hiển thị theo nhiều danh mục   DONE     products.controller + shop.ejs
Promotion/checkout theo danh mục phụ  DONE     helper/cart/promotion/checkout
Tài liệu deploy/migrate               DONE     docs/11-product-multi-category-migration.md
Prisma Client generate                FOLLOW   Windows EPERM cục bộ; chạy lại trước restart
```

## Review notes
- Đã sửa nguy cơ ghi đè điều kiện search khi thêm OR danh mục bằng `AND: [{ OR: ... }]`.
- Đã sửa bộ đếm danh mục con còn tham chiếu `_count.products` cũ.
- Đã tải relation categories ở home, cart suggestions và related products để giá promotion nhất quán.
- Route admin tiếp tục dùng middleware phân quyền hiện hữu.
