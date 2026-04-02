# Master Plan — Giai đoạn 3: Quản lý danh mục và sản phẩm
- Ngày: 2026-04-02 10:25
- BA nguồn: 00_ba.md

## 1) Goal
Triển khai hệ thống quản lý danh mục và sản phẩm hoàn chỉnh cho Admin, tích hợp upload ảnh Cloudinary và ghi log tồn kho. Đảm bảo dữ liệu nhất quán và giao diện thân thiện.

## 2) Scope
- **In-scope**:
    - CRUD Category (Phân cấp, Ảnh).
    - CRUD Product (SKU, Giá, Đơn vị tính, Xuất sứ, Tồn kho).
    - Upload đa ảnh (Cloudinary) + Thumbnail.
    - Bộ lọc/Tìm kiếm sản phẩm trong Admin.
    - Tự động tạo slug (Slugify).
    - Ghi log Inventory khi thay đổi stock.
    - Seeding dữ liệu mẫu Phase 3.
- **Out-of-scope**:
    - Quàn lý thuộc tính (Attributes) động.
    - Quản lý khuyến mãi phức tạp.

## 3) Constraints & Assumptions
- **Constraints**: Phải dùng EJS + Bootstrap 5. Ảnh phải lưu trên Cloudinary.
- **Assumptions**: 
    1. Middleware `isAdmin` đã hoạt động tốt từ Phase 2.
    2. Cloudinary config trong `.env` đã chính xác.
- **Questions**: Không có.

## 4) Recommended Approach
- Sử dụng `multer` và `cloudinary` SDK để xử lý upload.
- Sử dụng `slugify` để tạo slug từ tiếng Việt.
- Sử dụng `Prisma $transaction` khi cập nhật `Product.stock_quantity` và tạo `InventoryLog`.
- Mỗi module (`categories`, `products`, `inventory`) sẽ có đầy đủ Controller -> Service -> Route -> Validation.

## 5) Slice Plan
```
SLICE  GOAL                             DELIVERABLES                     DoD (testable)                 VERIFY (lệnh)                     CHECKPOINT
---    ----------                       -----------------------          -----------------------       -----------------------           ----------
S7     Category Skeleton & List         Routes, Controller, List VIEW    List hiển thị đúng data DB     npm run dev + browse /admin/cat    Pass
S8     Category CRUD + Upload           Add/Edit Form, Cloudinary Integ  Tạo cat có ảnh thành công      npm run dev + form submit          Pass
S9     Product Skeleton & List          Routes, Controller, List VIEW    List hiển thị + Search/Filter  npm run dev + browse /admin/prod   Pass
S10    Product CRUD (Info + Slug)       Add/Edit Form, Auto-slug logic   Lưu product gen slug đúng      npm run dev + form submit          Pass
S11    Product Images (Multi-upload)    Multer config, ProductImage CRUD Upload n ảnh + set thumbnail   npm run dev + image gallery        Pass
S12    Inventory Management             Stock logic + InventoryLog       Sửa stock -> sinh log đúng     npm run dev + check DB             Pass
S13    Seeding & Final Polish           Seed script (Phase 3), UI FIX    DB có data mẫu, UI mượt        npx prisma db seed                 Pass
```

## 6) Detailed Implementation Checklist
- **Slice S7 (Category Skeleton & List)**
    - [ ] Khởi tạo route `/admin/categories` trong `src/routes/admin.route.js`.
    - [ ] Viết `categories.controller.js` (render list).
    - [ ] Viết `categories.service.js` (getAll).
    - [ ] Tạo view `src/views/admin/categories/index.ejs`.
- **Slice S8 (Category CRUD + Upload)**
    - [ ] Cấu hình Multer storage cho Cloudinary (chủ yếu là `cloudinary.js` config).
    - [ ] API Create/Update Category.
    - [ ] View Form Add/Edit.
    - [ ] Logic xóa Category (có check product dependency).
- **Slice S9 (Product Skeleton & List)**
    - [ ] Khởi tạo route `/admin/products`.
    - [ ] Viết `products.controller.js` (render list với filter).
    - [ ] Viết `products.service.js` (getAll với pagination, search).
    - [ ] Tạo view `src/views/admin/products/index.ejs`.
- **Slice S10 (Product CRUD - Basic Info)**
    - [ ] API Create/Update Product (chưa có ảnh).
    - [ ] Logic auto-slug trong Service.
    - [ ] View Form Add/Edit (SKU, Price, Unit, etc.).
- **Slice S11 (Product Images)**
    - [ ] Xử lý `ProductImage` model trong Service.
    - [ ] Form upload nhiều ảnh (Dropzone hoặc Input multiple).
    - [ ] Logic set ảnh thumbnail.
- **Slice S12 (Inventory)**
    - [ ] Viết `inventory.service.js` (createLog).
    - [ ] Hook/Transaction khi update `stock_quantity`.
    - [ ] View History Log đơn giản cho Admin.
- **Slice S13 (Final)**
    - [ ] Viết `prisma/seeds/phase3_seed.js`.
    - [ ] Cập nhật `docs/04-roadmap-checklist.md`.

## 7) Data & Migration Plan
- Schema đã có sẵn, không cần migration mới trừ khi có thay đổi phát sinh.
- Chạy `npx prisma generate` sau khi verify schema.

## 8) Verification Plan
- **Manual**:
    - [ ] Vào admin, tạo category mới, upload ảnh -> Kiểm tra Cloudinary và DB.
    - [ ] Tạo product, bộ lọc theo category -> Kiểm tra kết quả trả về.
    - [ ] Đổi số lượng tồn kho -> Kiểm tra bảng InventoryLog.

## 9) Risks & Mitigations
- **Risk**: Upload ảnh chậm/lỗi. **Mitigation**: Thêm loading state và try-catch xóa ảnh trên Cloudinary nếu DB save fail.
- **Risk**: SKU trùng lặp. **Mitigation**: Unique constraint ở DB + Validation trước khi save.

## 12) DEEP THINKING RESULTS
### A) Phản biện kỹ thuật:
1. **"Dùng EJS render list product lớn có chậm không?"** -> Phải dùng Pagination (nằm trong S3).
2. **"Multer xử lý ảnh trên cùng server có tốn tài nguyên không?"** -> Dùng MemoryStorage hoặc streaming thẳng lên Cloudinary nếu server yếu.
3. **"Slug trùng lặp thì sao?"** -> Thêm hậu tố ngẫu nhiên (hoặc ID) nếu trùng.

### B) Dependency check:
- Product phụ thuộc vào Category (S1/S2 phải xong trước).
- Inventory phụ thuộc vào Product.

### D) Đề xuất chủ động:
- Sử dụng `express-validator` để đồng bộ validation.
- Thêm index cho `slug` và `sku` (Prisma đã có `@unique`).

---
**Xác nhận**: Đã cập nhật `00_requirements_log.md` và sẵn sàng chia slice sau khi user chốt.
