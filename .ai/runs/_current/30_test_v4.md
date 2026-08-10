# Test v4 — Product Multi-category
- Timestamp: 2026-08-10 12:00
- Kết quả: PASS WITH ENVIRONMENT NOTE.

- Prisma schema validation: PASS.
- Migration deploy + status: PASS; database up to date.
- Data integrity query: `products=4`, `missingPrimaryLinks=0`.
- JavaScript syntax: PASS cho service/controller/helper thay đổi.
- EJS compile: PASS cho create/edit/index admin và shop public.
- Promotion test: sản phẩm có category chính `10`, phụ `20`; promotion category `20` cho giá `100000 -> 90000`: PASS.
- Diff whitespace: PASS.
- Full coverage: repo không cấu hình test script/framework/coverage.
- Environment note: `prisma generate` gặp Windows `EPERM` khi unlink `node_modules/.prisma/client/default.js`; cần giải phóng file rồi chạy lại trước khi start app.
