# Hướng dẫn Kiểm soát máy chủ PM2 (WebHoaQua)

Tài liệu này cung cấp các lệnh quản lý PM2 được thiết kế riêng cho dự án WebHoaQua, dựa trên file `ecosystem.config.js`.

> **Môi trường hoạt động:** 
> - **Dev:** Tự động watch file trong `src/` và khởi động lại, đổ log vào thư mục `logs/`.
> - **Prod:** Tối ưu hóa hiệu năng, không theo dõi file, không hiện log Dev.

> **Cập nhật S49 (2026-11-12):** các lệnh trên trước đây dùng `all` và sẽ làm dừng/khởi động lại cả n8n chạy chung trong PM2. Nay chúng chỉ nhắm đúng ứng dụng web. Cấu hình RAM, swap, Nginx và sao lưu cho VPS 1GB xem `docs/14-vps-1gb-operations.md`. Mã dùng chung một PrismaClient; kiểm tra sức khỏe: `curl http://127.0.0.1:3000/healthz?db=1`.

## Các lệnh thường dùng

Tất cả các lệnh này có thể gõ trực tiếp qua `npm run`.

### 1. Khởi chạy Server
- `npm run pm2:dev` : Bật server ở chế độ Develop, phục vụ cho việc sửa code (Tương đương Nodemon).
- `npm run pm2:prod` : Bật server ở chế độ Production, phục vụ cho việc Live thật sự trên hosting.

### 2. Xem Nhật ký (Logs)
- `npm run pm2:logs` : Xem log web production (`pm2:logs:dev` cho bản dev). Không xem log của n8n.
- `npm run pm2:clean` : Xóa nhật ký PM2 của web (prod và dev). Không ảnh hưởng n8n.
- Bạn có thể vào trực tiếp thư mục `logs/` ở thư mục gốc của dự án để tải file:
  - `pm2-out-dev.log` : Nhật ký hoạt động chung của DEV.
  - `pm2-error-dev.log` : Báo lỗi khẩn cấp (Crash) của DEV.
  - `pm2-combined-dev.log` : Gộp cả Out và Error.

### 3. Tắt & Bảo trì
- `npm run pm2:restart` : Khởi động lại **chỉ web production** (`WebHoaQua-Prod`). `pm2:reload` nạp lại với `--update-env`; `pm2:restart:dev` cho bản dev.
- `npm run pm2:stop` : Dừng web production (n8n và các ứng dụng PM2 khác vẫn chạy). `pm2:stop:dev` cho bản dev.
- `npm run pm2:kill` : Xóa `WebHoaQua-Prod` và `WebHoaQua-Dev` khỏi PM2 (không xóa n8n hay tiến trình khác).

## Một vài mẹo nâng cao (Chạy qua npx)
Nếu bạn rành PM2, hãy dùng thẳng `npx pm2`:
- Xem danh sách server: `npx pm2 list`
- Giám sát RAM / CPU thực: `npx pm2 monit`

---

## 🚀 Quy trình áp dụng Code mới (Deploy Code)

### Trạng thái 1: Bạn đang Code ở môi trường Phát triển (DEV)
- **Đang chạy lệnh**: `npm run pm2:dev`
- **Cách áp dụng**: **KHÔNG CẦN LÀM GÌ CẢ!** 
- Nhờ cơ chế `watch: ["src"]` đã được thiết lập, mỗi khi bạn lưu file code (hoặc kéo git về) có chứa thay đổi trong thư mục `src`, PM2 sẽ *tự động nhận diện và khởi động lại Server* ngay lập tức trong chớp mắt. Bạn chỉ việc F5 trình duyệt.

### Trạng thái 2: Bạn đang ở môi trường Thực tế (PRODUCTION)
- **Đang chạy lệnh**: `npm run pm2:prod`
- Vì ở môi trường này chúng ta đã tắt tính năng `watch` nhằm tiết kiệm tài nguyên Server và đảm bảo ổn định. Khi có luồng Code mới đẩy lên (qua git pull hoặc upload file), bạn cần cập nhật thủ công theo trình tự chuẩn xác sau đây:

**Bước 1: Cập nhật thư viện (nếu có cài thêm package mới)**
```bash
npm install
```

**Bước 2: Cập nhật Database (CHỈ LÀM khi bạn có sửa file schema.prisma)**
```bash
npm run prisma:generate
# Nếu bạn vừa tạo bảng mới thì chạy thêm: npm run prisma:migrate
```

**Bước 3: Báo cho PM2 load lại code mới lên RAM**
```bash
npm run pm2:restart
```

*(Hoàn tất! Server sẽ áp dụng ngay code mới của bạn.)*
