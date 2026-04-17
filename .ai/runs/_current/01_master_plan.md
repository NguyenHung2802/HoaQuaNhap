# Master Plan - Sửa Logic Chiến dịch & Giỏ hàng (Slice 4)

## 1. Giới thiệu
Kế hoạch này tập trung vào việc sửa lỗi logic hiển thị chiến dịch khuyến mãi vận chuyển và đảm bảo trải nghiệm người dùng mượt mà khi tương tác với giỏ hàng.

## 2. Các lát cắt thực thi (Slices)

### Slice 4.1: Cập nhật Backend Logic cho Campaign
- **Mục tiêu:** Trả về đầy đủ thông tin loại hình khuyến mãi vận chuyển.
- **Thực hiện:**
    - Chỉnh sửa `src/modules/public/cart/cart.controller.js`.
    - Phân loại `shippingCampaign.type` (percent/amount).
    - Tính toán lại object `freeship` (đổi tên thành `shippingPromotion` cho đúng bản chất).

### Slice 4.2: Cập nhật UI hiển thị Chiến dịch
- **Mục tiêu:** Hiển thị đúng câu chào mời khách mua thêm dựa trên loại chiến dịch.
- **Thực hiện:**
    - Chỉnh sửa `src/views/public/cart/index.ejs`.
    - Logic hiển thị: 
        - Nếu type = `amount`: "Mua thêm X để giảm Y phí ship".
        - Nếu type = `percent` & value = 100: "Mua thêm X để được Freeship".
        - Nếu type = `percent` & value < 100: "Mua thêm X để giảm Y% phí ship".

### Slice 4.3: Đồng bộ UI Giỏ hàng (AJAX/Reload)
- **Mục tiêu:** Cập nhật trang giỏ hàng ngay khi thêm sản phẩm gợi ý.
- **Thực hiện:**
    - Chỉnh sửa `public/js/cart.js`.
    - Trong `addToCart`: Thêm check `if (window.location.pathname === '/cart') window.location.reload();`.

## 3. Kế hoạch kiểm thử (Test Plan)
- Test 1: Đơn hàng dưới ngưỡng -> Hiện đúng số tiền cần thêm và loại ưu đãi phí ship.
- Test 2: Đơn hàng trên ngưỡng -> Hiện đúng thông báo đã áp dụng ưu đãi.
- Test 3: Tại trang giỏ hàng, bấm "Thêm vào giỏ" ở SP gợi ý -> Trang tự load lại và cập nhật sản phẩm đó lên danh sách chính + cập nhật thanh progress bar.
