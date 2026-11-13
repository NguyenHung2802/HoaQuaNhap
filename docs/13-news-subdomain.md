# Subdomain tin tức ẩn (`tin.haianhfruit.com`)

Khu tin ẩn chạy **cùng ứng dụng Node** với web bán hàng, nhưng được tách theo **Host**:
- Request đến host `news.host` (Setting, mặc định `tin.haianhfruit.com`) chỉ do router tin ẩn xử lý. Không session, không cookie, không menu/giỏ hàng, không truy vấn danh mục.
- Chỉ có một đường dẫn hợp lệ: `/tin-tuc/{dd-mm-yyyy}/{slug}/{token}`. Mọi đường dẫn khác (kể cả `/`, `/admin`, `/api/v1/...`) trả 404 trung tính, không có thương hiệu.
- Host chính (`haianhfruit.com`) **không** phục vụ `/tin-tuc/...` (404).
- Mọi phản hồi có `X-Robots-Tag: noindex, nofollow, noarchive`; `robots.txt` của subdomain là `Disallow: /`. Tin ẩn không nằm trong sitemap, menu, blog hay trang chủ.
- Token 22 ký tự ngẫu nhiên (128 bit). Mỗi IP chỉ được "trượt" 30 lần mỗi phút, vượt thì nhận 429 trong tối đa 1 phút.

## 1. Triển khai trên VPS

### 1.1. DNS
Thêm bản ghi A: `tin` → IP VPS (cùng IP với domain chính). Kiểm tra: `nslookup tin.haianhfruit.com`.

### 1.2. Nginx
Tạo `/etc/nginx/sites-available/tin-haianhfruit`:
```nginx
server {
    listen 80;
    server_name tin.haianhfruit.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;                      # BẮT BUỘC: ứng dụng nhận biết host tin ẩn qua Host
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
```bash
sudo ln -s /etc/nginx/sites-available/tin-haianhfruit /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d tin.haianhfruit.com     # chọn chuyển HTTP sang HTTPS
```
Server block của domain chính giữ nguyên. Nếu domain chính dùng `server_name _` hoặc catch-all, bảo đảm block `tin.` được khớp trước.

### 1.3. Cài đặt trong admin
`Admin → Tin tức ẩn → Cài đặt`: kiểm tra `Host phục vụ tin ẩn` = `tin.haianhfruit.com`, đặt link affiliate mặc định, danh sách host affiliate, bật công tắc. Hoặc chạy `npx prisma db seed` để nạp mặc định.

### 1.4. Kiểm tra sau khi bật
```bash
curl -sI https://tin.haianhfruit.com/                       # 404, có X-Robots-Tag: noindex
curl -s  https://tin.haianhfruit.com/robots.txt             # Disallow: /
curl -sI https://haianhfruit.com/tin-tuc/12-11-2026/x/AAAAAAAAAAAAAAAAAAAAAA   # 404
```
Tạo một bài bằng API hoặc admin, đăng rồi mở link đầy đủ: phải thấy bài, không thấy menu hay giỏ hàng.

## 2. Chạy thử trên máy (không cần DNS)
Trình duyệt hiện đại tự trỏ `*.localhost` về máy bạn.
1. Trong `Admin → Tin tức ẩn → Cài đặt` đặt host = `tin.localhost:3000`.
2. Mở `http://tin.localhost:3000/tin-tuc/<ngày>/<slug>/<token>` (admin sao chép link ở danh sách; khi chạy dev, link sinh ra đã là `http://tin.localhost:3000/...`).
3. Web chính vẫn ở `http://localhost:3000`.

## 3. Lưu ý vận hành
- **Tách rủi ro**: subdomain tách được cookie, route và giao diện nhưng Google vẫn có thể liên hệ uy tín giữa domain chính và subdomain. Nếu muốn cách ly hoàn toàn, dùng tên miền riêng: chỉ cần đổi `news.host` và DNS/Nginx, không đổi mã.
- **Công tắc khẩn cấp**: tắt `Bật khu tin ẩn và API đăng bài` thì mọi link tin ẩn trả 404 sau tối đa 30 giây, API trả 503.
- **Mất kết nối DB**: host tin ẩn trả 500 chữ thuần, không để lộ web bán hàng.
- **Trình thu thập mạng xã hội** (Facebook, Zalo) vẫn đọc được thẻ Open Graph để tạo ảnh xem trước; `noindex` chỉ ảnh hưởng công cụ tìm kiếm.
- Bài `draft` luôn 404 ở host công khai; xem trước qua `/admin/news/preview/:id` (cần đăng nhập admin).
