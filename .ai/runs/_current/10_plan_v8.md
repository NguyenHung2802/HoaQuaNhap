# Plan v8 — Sản phẩm thuộc nhiều danh mục
- Ngày: 2026-08-10 12:00
- Tham chiếu: `10_plan.md` đến `10_plan_v7.md`
- Lý do bổ sung: Admin cần gán một sản phẩm vào nhiều danh mục và bảo toàn dữ liệu cũ.

## Phạm vi đã chốt
- Giữ `Product.category_id` làm danh mục chính.
- Thêm bảng nối `ProductCategory` và backfill toàn bộ quan hệ cũ.
- Cập nhật CRUD/duplicate, public category filter/count, related products, cart, promotion và checkout.
- Viết tài liệu deploy/migration riêng.

## Slice thực thi
- S1: DB + backfill + Prisma contract.
- S2: Admin create/edit/list/duplicate.
- S3: Public listing/detail + cart/promotion/checkout.
- S4: Verification, migration guide và review.

## Definition of Done
- Không mất quan hệ danh mục cũ.
- Một sản phẩm lưu và hiển thị được ở nhiều danh mục.
- Khuyến mãi theo danh mục bổ sung hoạt động.
- Prisma schema hợp lệ; JavaScript/EJS compile; migration có hướng dẫn kiểm tra và rollback.
