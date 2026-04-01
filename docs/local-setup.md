# Hướng dẫn cài đặt Môi trường Local (WebHoaQua)

Tài liệu này hướng dẫn bạn từng bước để chạy website lần đầu tiên trên máy tính cá nhân.

## 1. Yêu cầu hệ thống
- **Node.js**: Phiên bản 18 trở lên.
- **PostgreSQL**: Đã được cài đặt và đang chạy.
- **Git** (Tùy chọn)

## 2. Các bước cài đặt chi tiết

### Bước 1: Tạo Database trong PostgreSQL
Mở công cụ quản lý cơ sở dữ liệu của bạn (ví dụ: pgAdmin hoặc dùng lệnh `psql`) và tạo một cơ sở dữ liệu mới:
```sql
CREATE DATABASE web_hoaqua;
```

### Bước 2: Cấu hình biến môi trường
Mở file `.env` ở thư mục gốc của dự án và cập nhật dòng `DATABASE_URL` theo đúng thông tin máy của bạn:
```bash
# Định dạng: postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
DATABASE_URL="postgresql://postgres:MAT_KHAU_CUA_BAN@localhost:5432/web_hoaqua?schema=public"
```
*(Thay thế `postgres` bằng username và `MAT_KHAU_CUA_BAN` bằng mật khẩu PostgreSQL của bạn)*.

### Bước 3: Cài đặt thư viện
Nếu chưa thực hiện, hãy chạy lệnh sau tại thư mục gốc:
```bash
npm install
```

### Bước 4: Khởi tạo bảng và dữ liệu mẫu
Khi database đã sẵn sàng và `.env` đã được cấu hình, hãy chạy các lệnh sau theo thứ tự:

1. **Tạo bảng (Migration)**:
   ```bash
   npx prisma migrate dev --name init
   ```
2. **Nạp dữ liệu mẫu (Seed)**: (Dữ liệu mẫu gồm Admn, Danh mục, Sản phẩm)
   ```bash
   npx prisma db seed
   ```

### Bước 5: Chạy ứng dụng
Sử dụng lệnh sau để khởi động server ở chế độ phát triển (tự động tải lại khi code thay đổi):
```bash
npm run dev
```

Sau khi chạy thành công, mở trình duyệt và truy cập: [http://localhost:3000](http://localhost:3000)

## 3. Một số lưu ý
- Nếu gặp lỗi kết nối Database, hãy kiểm tra xem Service PostgreSQL đã chạy chưa và chuỗi kết nối trong `.env` đã chính xác chưa.
- Để quản lý dữ liệu trực tiếp qua giao diện, bạn có thể chạy `npx prisma studio`.
