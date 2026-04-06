# Slice 3: Logic Cập nhật thông tin, Upload & Quản lý địa chỉ (API/DB Tier)

## 1. Upload Avatar
Sử dụng `multer` và `cloudinary` để xử lý upload ảnh đại diện.

## 2. API Địa chỉ
Triển khai các phương thức trong `profile.controller.js`:
- `saveAddress`: Thêm mới hoặc Cập nhật địa chỉ.
- `deleteAddress`: Xoá địa chỉ.
- `setDefaultAddress`: Đặt địa chỉ mặc định.
- `uploadAvatar`: Upload ảnh lên Cloudinary và cập nhật `User`.

## 3. Thao tác thực thi
1. Sửa `profile.controller.js` để thêm các method mới.
2. Sửa `profile.route.js` để đăng ký các route API tương ứng.
3. Cập nhật `profile.controller.js` để có thêm phần xử lý file upload.
