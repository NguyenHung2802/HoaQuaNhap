# Giới thiệu dự án Website Bán Hoa Quả Nhập Khẩu

## 1. Giới thiệu dự án

Đây là tài liệu gốc để triển khai **website bán hoa quả nhập khẩu** theo **Phương án 1**:

- **Backend**: Node.js + Express
- **Frontend website**: EJS / server-side rendering
- **Trang quản trị**: Admin server-rendered
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Upload ảnh**: Cloudinary
- **Cache / queue**: Redis (nâng cấp sau)

Mục tiêu của website không chỉ là trưng bày sản phẩm, mà còn phải phục vụ đồng thời các nhu cầu sau:

1. Quảng bá thương hiệu
2. Bán hàng online
3. Quản lý sản phẩm
4. Quản lý tồn kho
5. Quản lý đơn hàng
6. Theo dõi doanh thu và hiệu quả kinh doanh
7. Mở rộng sau này thành một hệ thống vận hành bài bản

## 2. Mục tiêu dự án

### 2.1. Mục tiêu kinh doanh

Website cần hỗ trợ:
- Trưng bày sản phẩm đẹp, rõ ràng, chuyên nghiệp
- Tăng sự tin tưởng của khách hàng
- Tăng tỷ lệ chuyển đổi từ người xem sang người mua
- Hỗ trợ vận hành nội bộ dễ dàng
- Theo dõi hiệu quả bán hàng
- Có khả năng mở rộng trong tương lai

### 2.2. Định vị thương hiệu

Với mặt hàng là **hoa quả nhập khẩu**, website nên đi theo phong cách:
- Sạch
- Tươi
- Cao cấp
- Tin cậy
- Hiện đại
- Dễ dùng trên điện thoại

### 2.3. Đối tượng khách hàng

Nên xác định rõ các nhóm chính:
- Khách mua lẻ hằng ngày
- Khách mua biếu / quà tặng
- Khách mua theo combo gia đình
- Khách hàng văn phòng / doanh nghiệp
- Khách hàng thân thiết có nhu cầu đặt định kỳ

## 3. Phạm vi triển khai theo phương án đã chọn

### 3.1. Phạm vi giai đoạn đầu

Triển khai hệ thống đủ dùng để:
- Hiển thị sản phẩm
- Tìm kiếm / lọc sản phẩm
- Thêm giỏ hàng
- Đặt hàng
- Quản lý đơn hàng
- Quản lý tồn kho cơ bản
- Quản lý sản phẩm và nội dung trang chủ
- Theo dõi dashboard cơ bản

### 3.2. Chưa ưu tiên ngay

Các tính năng sau có thể để giai đoạn 2 hoặc 3:
- Thanh toán online
- Loyalty / điểm thưởng
- CRM
- Chatbot
- Gợi ý AI
- Đa chi nhánh / đa kho
- Đa ngôn ngữ
- Mobile app
