# Thay đổi sản phẩm thuộc nhiều danh mục

- Ngày: 2026-08-10
- Phạm vi: Prisma, PostgreSQL, Admin Product, Public Product, Promotion, Checkout

## Thay đổi dữ liệu

Migration `20260810120000_add_product_categories` tạo bảng nối `ProductCategory` cho quan hệ nhiều-nhiều giữa sản phẩm và danh mục.

Trường `Product.category_id` vẫn được giữ lại và tiếp tục là **danh mục chính**. Migration không xóa hay cập nhật dữ liệu sản phẩm hiện hữu.

Migration tự backfill dữ liệu cũ bằng câu lệnh:

```sql
INSERT INTO "ProductCategory" ("product_id", "category_id")
SELECT "id", "category_id" FROM "Product"
ON CONFLICT ("product_id", "category_id") DO NOTHING;
```

Do đó mỗi sản phẩm cũ sẽ có một quan hệ tương ứng với danh mục cũ sau khi migrate.

## Lệnh triển khai trên môi trường nhận code

Sao lưu database trước khi chạy migration. Sau đó, tại thư mục dự án:

```powershell
npm install
npx prisma migrate deploy
npx prisma generate
```

Khởi động lại tiến trình ứng dụng sau khi generate Prisma Client:

```powershell
npm run pm2:restart
```

Nếu môi trường không dùng PM2, khởi động lại bằng cơ chế deploy hiện có.

Không dùng `prisma migrate dev` trên production.

## Kiểm tra sau migration

Chạy hai truy vấn sau trên PostgreSQL. Kết quả truy vấn thứ hai phải bằng `0`:

```sql
SELECT COUNT(*) AS product_count FROM "Product";

SELECT COUNT(*) AS missing_primary_category_links
FROM "Product" p
LEFT JOIN "ProductCategory" pc
  ON pc."product_id" = p."id"
 AND pc."category_id" = p."category_id"
WHERE pc."product_id" IS NULL;
```

Sau đó kiểm tra thủ công:

1. Mở sửa một sản phẩm cũ: danh mục chính phải giữ nguyên.
2. Chọn thêm ít nhất hai danh mục bổ sung và lưu.
3. Sản phẩm phải xuất hiện ở từng trang danh mục đã chọn.
4. Khuyến mãi theo một danh mục bổ sung phải áp dụng cho sản phẩm.
5. Thêm sản phẩm vào giỏ và hoàn tất kiểm tra checkout.

## Rollback

Code cũ vẫn có thể chạy vì `Product.category_id` không bị xóa. Nếu cần rollback ứng dụng, quay lại phiên bản code trước và để nguyên bảng `ProductCategory`; bảng này không ảnh hưởng truy vấn cũ.

Không xóa bảng `ProductCategory` nếu chưa sao lưu các liên kết danh mục bổ sung, vì các liên kết này không tồn tại trong `Product.category_id`.
