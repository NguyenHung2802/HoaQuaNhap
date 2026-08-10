# Implement v4 — Product Multi-category
- Timestamp: 2026-08-10 12:00
- Trạng thái: Done (implementation)
- Plan: `10_plan_v8.md`

## Implemented
- [x] Tạo `ProductCategory`, composite PK, category index và cascade FK.
- [x] Backfill toàn bộ `Product.category_id` hiện hữu.
- [x] Admin chọn danh mục chính và nhiều danh mục bổ sung.
- [x] Create/update chạy transaction; duplicate sao chép đủ danh mục.
- [x] Public filter/count/related hiểu quan hệ mới.
- [x] Cart, promotion, checkout áp dụng khi khớp bất kỳ danh mục nào.
- [x] Viết tài liệu migration/deploy và rollback.

## Verification
- `npx prisma validate`: PASS.
- `npx prisma migrate deploy`: PASS trên DB development.
- Backfill: 4 sản phẩm, 0 sản phẩm thiếu liên kết danh mục chính.
- JavaScript syntax + EJS compile + `git diff --check`: PASS.
- `npx prisma generate`: BLOCKED cục bộ bởi Windows EPERM tại file generated trong `node_modules`; không phải lỗi schema.

```text
BEHAVIOR                         HAPPY   VALIDATION   FALLBACK/COMPAT
Create/update nhiều danh mục     OK      ít nhất 1    primary luôn được đưa vào relation
Promotion danh mục phụ           OK      N/A          fallback category_id
Migration dữ liệu cũ             OK      FK/PK         ON CONFLICT DO NOTHING
Search + category filter         OK      N/A          AND bọc OR, không ghi đè search
```
