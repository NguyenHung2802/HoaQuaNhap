# Vận hành trên VPS 1 vCPU / 1GB RAM / 20GB SSD

VPS chạy chung: **web (Node/PM2) + PostgreSQL + n8n + Nginx**. Tài liệu này là bản cấu hình khuyến nghị để cả bốn chạy ổn định, không bị kernel OOM-kill.

> Các thay đổi trong mã (S49) đã làm sẵn: dùng **một** `PrismaClient` duy nhất, cache menu danh mục 5 phút, endpoint `/healthz`, cấu hình PM2 giới hạn RAM, script `scripts/backup-db.js`. Phần dưới là việc cần làm trên máy chủ.

## 1. Ngân sách RAM (mục tiêu)

| Thành phần | Ngân sách | Cách giữ |
| --- | --- | --- |
| Hệ điều hành + Nginx | ~100MB | tắt dịch vụ không dùng |
| PostgreSQL | ≤ 150MB | mục 3 |
| Web (Node) | ≤ 250MB (RSS) | `--max-old-space-size=192`, restart khi > 280MB |
| n8n | ≤ 450MB | `max_memory_restart: '450M'`, concurrency 2 |
| **Dự phòng** | swap 2GB | mục 2 |

Tổng vượt 1GB khi cả n8n và web cùng nặng, vì vậy **swap là bắt buộc** và nên theo dõi (mục 8). Nếu swap thường xuyên dùng quá 50% hoặc RAM trống < 150MB kéo dài, hãy nâng VPS lên 2GB.

## 2. Swap 2GB (làm một lần)
```bash
free -h                                  # nếu dòng Swap đã > 0 thì có thể bỏ qua
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
# Ưu tiên RAM, chỉ dùng swap khi thật cần; giữ cache inode/dentry
echo 'vm.swappiness=10'          | sudo tee /etc/sysctl.d/99-hoaqua.conf
echo 'vm.vfs_cache_pressure=50'  | sudo tee -a /etc/sysctl.d/99-hoaqua.conf
sudo sysctl --system
```
Swap chiếm 2GB trên ổ 20GB: chấp nhận được vì ảnh/video không lưu trên VPS (đều ở Cloudinary).

## 3. PostgreSQL gọn nhẹ
Sửa `/etc/postgresql/<phiên bản>/main/postgresql.conf` (hoặc tạo `conf.d/hoaqua.conf`):
```
shared_buffers = 64MB
effective_cache_size = 256MB
work_mem = 4MB
maintenance_work_mem = 32MB
max_connections = 30
wal_buffers = 4MB
checkpoint_completion_target = 0.9
```
```bash
sudo systemctl restart postgresql
```
Trong `.env` giới hạn pool của ứng dụng (mỗi PrismaClient mở nhiều kết nối; ứng dụng đã gộp còn một client):
```
DATABASE_URL="postgresql://USER:PASS@localhost:5432/DB?schema=public&connection_limit=5"
```

## 4. PM2
Web và n8n là **hai ứng dụng riêng** trong PM2. Các script `npm run pm2:*` chỉ tác động tới web (`WebHoaQua-Prod`/`WebHoaQua-Dev`), không đụng n8n.
```bash
npm run pm2:prod              # khởi động web (production)
npm run pm2:reload            # nạp lại sau khi deploy (--update-env)
npm run pm2:logs              # xem log web
pm2 start /home/deploy/n8n-ecosystem.config.js   # n8n (xem docs/10-self-host-n8n.md)
pm2 save && pm2 startup                           # tự chạy lại khi VPS khởi động
```
Cấu hình web production (`ecosystem.config.js`): 1 tiến trình fork, heap tối đa ~192MB, tự restart khi RSS > 280MB, `kill_timeout: 3000` để ghi nốt thống kê tin ẩn trước khi dừng.

Xoay vòng log PM2 để không đầy ổ:
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

## 5. Nginx
Ba host cùng trỏ vào ứng dụng: `haianhfruit.com` (web), `tin.haianhfruit.com` (tin ẩn, xem `docs/13-news-subdomain.md`), `n8n.haianhfruit.com` (n8n, xem `docs/10-self-host-n8n.md`).

Thêm vào `/etc/nginx/nginx.conf`, khối `http {}` (nén và giới hạn tốc độ):
```nginx
gzip on;
gzip_comp_level 5;
gzip_min_length 512;
gzip_types text/css application/javascript application/json image/svg+xml text/plain text/xml;
limit_req_zone $binary_remote_addr zone=login:10m rate=10r/m;
```
Server block của web chính (ngoài các dòng `proxy_*` thông thường):
```nginx
server {
    server_name haianhfruit.com www.haianhfruit.com;
    client_max_body_size 10m;                 # ảnh admin tối đa 5MB

    # Tệp tĩnh: trình duyệt giữ lại 7 ngày, giảm tải cho Node
    location ~* \.(?:css|js|png|jpe?g|webp|gif|svg|ico|woff2?)$ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        expires 7d;
        add_header Cache-Control "public";
    }

    # Chặn dò mật khẩu đăng nhập
    location = /auth/login {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API đăng bài chỉ cho n8n nội bộ (n8n gọi http://localhost:3000, không đi qua Nginx)
    location /api/v1/ { allow 127.0.0.1; deny all; }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
Lưu ý: `css/js` đang không có mã phiên bản trong tên file, nên sau khi sửa giao diện hãy tăng thời gian cache dần hoặc thêm `?v=` vào link để khách thấy bản mới.

## 6. Dọn ổ đĩa (20GB)
```bash
df -h /                                   # kiểm tra định kỳ
sudo journalctl --vacuum-size=100M        # giới hạn nhật ký hệ thống
sudo apt-get clean && sudo apt-get autoremove -y
npm cache clean --force                   # sau khi cài thư viện
du -xh / --max-depth=2 2>/dev/null | sort -h | tail -15   # tìm thư mục lớn
```
Ứng dụng không lưu ảnh/video trên VPS. Thư mục `public/uploads` chỉ còn tệp cũ (nếu có).

## 7. Sao lưu cơ sở dữ liệu
```bash
sudo apt install -y postgresql-client
node scripts/backup-db.js                 # thử chạy tay
```
Cron lúc 3h sáng (ghi log vào `logs/backup.log`):
```
0 3 * * * cd /đường/dẫn/WebHoaQua && /usr/bin/node scripts/backup-db.js >> logs/backup.log 2>&1
```
- Lưu ở `/var/backups/hoaqua`, giữ 7 ngày (`BACKUP_KEEP_DAYS`), từ chối chạy khi ổ còn dưới 1GB trống (`BACKUP_MIN_FREE_MB`).
- **Sao lưu chỉ nằm trên VPS thì mất cả hai khi ổ hỏng.** Đặt `RCLONE_REMOTE=gdrive:hoaqua-backup` (đã cấu hình `rclone`) để tự chép ra ngoài.
- Thử khôi phục định kỳ: `gunzip -c db-YYYYMMDD-HHMMSS.sql.gz | psql "$DATABASE_URL_TEST"`.
- n8n: sao lưu thư mục `/home/deploy/.n8n/` như trong `docs/10-self-host-n8n.md`.

## 8. Theo dõi
```bash
free -h && swapon --show                  # RAM/swap
pm2 monit                                  # CPU/RAM từng ứng dụng
curl -s http://127.0.0.1:3000/healthz?db=1 # {"status":"ok","rssMb":..,"db":"ok"}
sudo dmesg -T | grep -i -E "killed process|out of memory"   # đã có tiến trình bị OOM-kill chưa
```
Gợi ý: đăng ký `/healthz?db=1` vào một dịch vụ giám sát miễn phí (UptimeRobot...) để biết ngay khi web sập; `503` nghĩa là mất kết nối DB.

## 9. Quy trình deploy bản có API + tin ẩn (S42–S49)
1. **Sao lưu DB:** `node scripts/backup-db.js`.
2. `git pull`, rồi `npm ci --omit=dev` (cần để cài `sanitize-html`).
3. `.env`: thêm `SITE_URL="https://haianhfruit.com"`, bổ sung `connection_limit` cho `DATABASE_URL`.
4. `npx prisma migrate deploy && npx prisma generate` (migration `20261112100000_news_api_foundation`).
5. `npx prisma db seed` (nạp cài đặt `news.*`, không ghi đè giá trị đã có).
6. DNS + Nginx + SSL cho `tin.haianhfruit.com` (`docs/13-news-subdomain.md`).
7. `npm run pm2:reload`, kiểm tra `curl -s http://127.0.0.1:3000/healthz?db=1`.
8. Admin: **API Keys** (tạo key cho n8n), **Tin tức ẩn → Cài đặt** (host, link affiliate mặc định).
9. Thử: tạo bài bằng API (`docs/12-api-posts.md`), mở link `tin.` trên điện thoại, kiểm tra popup và thống kê.
10. Rollback: `.ai/runs/_current/11_plan_slices/S42.md` mô tả cách gỡ migration; web quay về bản mã cũ bằng `git checkout` + `pm2:reload` (cột mới không ảnh hưởng mã cũ).

## 10. Việc chưa làm tự động
- Chưa chạy thử trên VPS thật: toàn bộ lệnh trong tài liệu này cần được thử và điều chỉnh theo bản Ubuntu/PostgreSQL thực tế.
- `pm2-logrotate`, swap, Nginx, UFW và cron là thao tác thủ công trên máy chủ.
