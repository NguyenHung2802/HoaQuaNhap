# Master Plan: Phase 7 - Nội dung & Truyền thông

## 1. Mục tiêu
Làm giàu nội dung trang web để thu hút và giữ chân người dùng thông qua Banner, Blog, các chính sách, và các đánh giá từ khách hàng khác. Mang lại diện mạo một cửa hàng trực tuyến đầy đủ, uy tín.

## 2. Kiến trúc giải pháp
- **Content Controller:** Quản lý các trang thông tin tĩnh Công khai (Giới thiệu, Chính sách).
- **Blog Controller (Admin & Public):** CRUD và hiển thị tin tức.
- **Banner Controller (Admin):** Quản lý ảnh quảng cáo cho trang chủ.
- **Review Service:** Xử lý gửi đánh giá và Admin phê duyệt.
- **Tích hợp TinyMCE:** Để Admin soạn thảo nội dung Blog giàu văn bản.

## 3. Các Slices (Lát cắt thực thi)

### Lát cắt 1: S30 - Banner Management (Admin)
- **Backend:** CRUD `Banner`. Có trường `sort_order` để sắp xếp banner nào xuất hiện trước.
- **UI Admin:** Lưới danh sách banner, form upload ảnh banner lên Cloudinary.
- **UI Public:** Fetch banner có `is_active=true` và truyền vào Swiper Slider ở trang chủ.

### Lát cắt 2: S31 - Blog / News (Admin & Public)
- **Backend:** CRUD `BlogPost`. Slug tự động sinh từ tiêu đề. Phân trang cho trang danh sách tin tức.
- **UI Admin:** Tích hợp TinyMCE/Quill. Form upload ảnh Thumbnail.
- **UI Public:** Trang `/blogs` (danh sách) và `/blog/:slug` (chi tiết). Hiển thị "Bài viết mới nhất" tại trang chủ.

### Lát cắt 3: S32 - Product Reviews (Public & Admin)
- **Public:** Form đánh giá cuối trang Chi tiết sản phẩm (Rating + Content).
- **Backend:** `POST /product/:id/review`. Mặc định `is_approved = false`.
- **UI Admin:** `GET /admin/reviews` để phê duyệt (Approve) hoặc Xóa (Delete).
- **Logic:** Tính toán trung bình số sao hiển thị trên trang sản phẩm.

### Lát cắt 4: S33 - Trang thông tin tĩnh (Static Content & FAQ)
- **Backend:** CRUD `Setting` với `group_key="pages"`. Key có thể là `about-us`, `delivery-policy`, `refund-policy`, `faq`.
- **Frontend:** Các route `/about`, `/policy/:key`, `/faq`. Tên footer sẽ dẫn tới các link này.

## 4. Những cải tiến bổ sung (Should-do)
- Thêm SEO metadata (Meta title/desc) cho từng bài blog.
- Gửi email thông báo cho Admin khi có review mới chờ duyệt.
