# MASTER PLAN — PHASE 4: PUBLIC SITE

## 1. Mục tiêu công việc
Hoàn thiện giao diện người dùng (Storefront) lấy cảm hứng từ thiết kế "The Digital Orchard". Đảm bảo tính thẩm mỹ cao (Premium), hiệu năng tốt và Responsive hoàn toàn trên di động.

## 2. Danh sách Slices (Lát cắt)

### Slice S14: Assets & Global Styles
- **Nội dung**: Chuẩn bị logo, Google Fonts (Playfair Display cho tiêu đề, Outfit cho nội dung), và Custom CSS cơ sở cho Public Site.
- **Mục tiêu**: Thiết lập bảng màu và typography đồng nhất.

### Slice S15: Layout, Header & Footer (Refactor)
- **Nội dung**: Cập nhật `main.ejs`, `header.ejs`, `navbar.ejs` và `footer.ejs` theo chuẩn thiết kế.
- **Mục tiêu**: Navbar có ô tìm kiếm tròn, wishlist icon, cart badge và menu cấp 2 động từ Database.

### Slice S16: Home Page — Hero & Categories Circle
- **Nội dung**: Hoàn thành phần đầu trang chủ: Banner Hero (Slider hoặc Static) và danh sách danh mục biểu tượng tròn (Circle Icons).
- **Mục tiêu**: WOW người dùng ngay từ góc nhìn đầu tiên.

### Slice S17: Home Page — Featured Sections (Products & Promo)
- **Nội dung**: Render danh sách "Sản phẩm yêu thích" (New Arrivals/Best Sellers) và Banner Combo quảng cáo.
- **Mục tiêu**: Kết nối dữ liệu DB thật hiển thị lên trang chủ.

### Slice S18: Home Page — Trust Blocks (Commitments & Community)
- **Nội dung**: Xây dựng khối "Tại sao chọn chúng tôi", "Đánh giá khách hàng" và "Tin tức mới nhất".
- **Mục tiêu**: Tăng độ tin cậy và hoàn thiện trang chủ.

### Slice S19: Shop Page (Product Listing & Filtering)
- **Nội dung**: Trang `/products` với Sidebar bộ lọc (Danh mục, Giá), Grid sản phẩm và phân trang logic.
- **Mục tiêu**: Cho phép người dùng tìm kiếm sản phẩm dễ dàng.

### Slice S20: Product Detail Page (Gallery & Specs)
- **Nội dung**: Trang `/product/:slug` với thư viện ảnh (Swiper.js), bảng thông số kỹ thuật, mô tả HTML và Sản phẩm liên quan.
- **Mục tiêu**: Cung cấp đầy đủ thông tin để người dùng quyết định mua hàng.

## 3. Checklist chuẩn SEO & UX
- [ ] Render Meta Title/Description động theo tên sản phẩm.
- [ ] Thêm thẻ Alt cho toàn bộ hình ảnh.
- [ ] Tối ưu hóa CLS (Cumulative Layout Shift) cho Banner.
- [ ] Kiểm tra hiển thị trên thiết bị iOS/Android.

## 4. Kế hoạch triển khai
- Thứ tự thực thi: S14 -> S20.
- Sau mỗi slice sẽ tiến hành `/test` và `/review`.
- Lưu nhật ký tại `20_implement.md`.
