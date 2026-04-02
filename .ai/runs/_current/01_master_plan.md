# Master Plan - Enhance Phase 4 & Fix Admin Product Image Upload

## 1. Mục tiêu
Hoàn thiện trải nghiệm người dùng cuối (Public Site) với bộ lọc nâng cao, xem ảnh phóng to và sửa lỗi backend quản trị ảnh sản phẩm.

## 2. Các lát cắt thực thi (Slices)

### Slice 1: Database Refinement (Model & Seeding)
- **Công việc**:
    - Kiểm tra `schema.prisma` và migration. (Đã thấy `ProductImage` có sẵn).
    - Cập nhật Seed data để có đầy đủ `origin_country`, `status`, và nhiều ảnh cho các sản phẩm mẫu. (Để hỗ trợ test bộ lọc).
    - Phân tích thêm thuộc tính `original_url` cho `ProductImage` nếu cần (như đề xuất trong nhật ký).
- **Trạng thái**: Plan.

### Slice 2: Backend Logic - Listing & Filters
- **Công việc**:
    - Cập nhật `ProductController.getPublicListing` (hoặc tương tự) để nhận các tham số: `origin`, `minPrice`, `maxPrice`, `status`, `category`.
    - Viết Prisma query động (Dynamic Where).
- **Trạng thái**: Plan.

### Slice 3: Frontend - Refined Sidebar Filters (Listing Page)
- **Công việc**:
    - Cập nhật layout `listing.ejs` (sidebar).
    - Tích hợp Price Range Slider (NoUI Range Slider hoặc Bootstrap native).
    - Hiển thị counts cho từng danh mục.
    - Xử lý link/request khi người dùng chọn lọc.
- **Trạng thái**: Plan.

### Slice 4: Frontend - Image Expansion (Detail Page)
- **Công việc**:
    - Tích hợp `Fancybox` hoặc `PhotoSwipe`.
    - Cho phép click vào Swiper Slides trong `detail.ejs` để mở Lightbox.
- **Trạng thái**: Plan.

### Slice 5: Admin Fixing - Multi-Image Upload
- **Công việc**:
    - Cập nhật `ProductController.adminCreateProduct` và `adminUpdateProduct`.
    - Sửa logic xử lý `req.files` của Multer/Cloudinary để hỗ trợ tới 5 ảnh.
    - Cập nhật UI trang Admin để hiển thị/quản lý 5 slot ảnh.
- **Trạng thái**: Plan.

## 3. Danh sách kiểm tra (Checklist)
- [ ] Lọc được sản phẩm theo Nguồn gốc.
- [ ] Lọc được sản phẩm theo Khoảng giá (Price Slider).
- [ ] Lọc được sản phẩm theo Trạng thái (Mới về, Giảm giá, Sẵn có).
- [ ] Xem được ảnh phóng to tại trang Chi tiết.
- [ ] Quản trị viên upload được 5 ảnh mà không bị ghi đè.
- [ ] Tiến độ được cập nhật vào `docs/04-roadmap-checklist.md`.
