# Master Plan - Optimization (Phase 8)

Dựa trên yêu cầu và Business Analysis, dưới đây là kế hoạch triển khai chi tiết:

## 1. Mục tiêu (Goals)
- Hiển thị % giảm giá trực quan cho khách hàng (Banner góc ảnh).
- Tự động hóa việc tạo SKU chuyên nghiệp cho Admin.
- Cải thiện trải nghiệm quản trị khi xóa ảnh sản phẩm.
- Tính toán mức giá hời nhất cho khách hàng dựa trên tất cả các chương trình khuyến mãi hiện có.

## 2. Các Slices (Phân lát thực hiện)

### Slice 1: Backend - Core Discount Logic & Promotion Helper
- **Mục tiêu**: Xây dựng bộ não tính toán giá tốt nhất.
- **Công việc**:
    - Tạo `src/utils/promotion-helper.js`: Hàm `calculateProductPrice(product, activePromotions)`.
    - Trả về: `original_price`, `best_price`, `discount_percent`, `applied_promotion_name`.
    - Tích hợp logic tìm kiếm Promotion Campaign đang active vào Service của Products.

### Slice 2: Admin UI - Image Deletion & SKU Suggestion
- **Mục tiêu**: Cải thiện dashboard admin.
- **Công việc**:
    - Backend: Thêm API `/admin/products/check-sku` để gợi ý SKU duy nhất.
    - Frontend:
        - Cập nhật CSS: Thêm nút X cho list ảnh hiện tại và list ảnh upload mới.
        - Cập nhật JS: Thêm listener cho Name input để đồng bộ SKU, check trùng via API.

### Slice 3: Public UI - Discount Badge & Price Display
- **Mục tiêu**: Wow khách hàng với hiển thị % giảm giá.
- **Công việc**:
    - Cập nhật partial `product-card.ejs` (hoặc copy sang các trang list khác) để hiển thị Badge ở góc trên bên phải.
    - Cập nhật Shop page (Listing) để sử dụng Promotion Helper.
    - Cập nhật Detail page để đồng bộ logic hiển thị giá hời nhất.

## 3. Danh sách công việc (Checklist)

### Must-do:
- [ ] Xây dựng `promotion-helper.js`.
- [ ] API `check-sku` cho Admin.
- [ ] Cập nhật UI xóa ảnh Admin (nút X đỏ).
- [ ] Logic hiển thị Badge % trên Home/Shop.
- [ ] Đồng bộ logic SKU slug (nho-han-1, nho-han-2...).

### Should-do:
- [ ] Refactor product cards thành một partial dùng chung (nếu chưa có).
- [ ] Unit test cho `calculateProductPrice`.

## 4. Rủi ro & Giải pháp
- **Rủi ro trùng lặp SKU**: Nếu 2 admin cùng tạo 1 lúc. Giải pháp: Sử dụng Atomic transaction và double-check lúc save.
- **Hiệu năng khi tính toán giá hời**: Khi có quá nhiều campaign. Giải pháp: Filter campaign theo Type/Target từ query database trước khi loop qua products.
