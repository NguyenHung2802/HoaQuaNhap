# Giai đoạn 9 — Production và vận hành

## Mục tiêu
Dọn dẹp môi trường thử nghiệm và đưa website lên chạy cho người dùng thực.

## Việc cần làm
- [ ] Chốt dữ liệu thực: Xóa toàn bộ dữ liệu Test (nhưng giữ seeding dữ liệu danh mục ban đầu)
- [ ] Deploy môi trường thực tế (VPS / PaaS):
    - Dùng PM2 / Docker quản lý process Node.js
    - Nginx làm Proxy ngược (Reverse Proxy)
    - SSL Certificate (Let's Encrypt) cài qua Certbot
- [ ] Backup Database: Script tự động dump DB hàng ngày
- [ ] Logging: Cài đặt Winston/Pino đẩy log ra file để quản trị khi có lỗi
- [ ] Giám sát lỗi (Error Monitoring): Sentry (Nếu cần)
- [ ] Domain integration: Kết nối tên miền chính cửa hàng

## Kết quả đầu ra
- Website chạy ổn định 24/7 dưới tên miền thật.
- Có hệ thống sẵn sàng ứng phó khi gặp sự cố dữ liệu.
- SSL bảo mật xanh (HTTPS).
