# Giai đoạn 9 — Production & Vận hành

> **Dành cho người mới:** Hướng dẫn này đi từng bước từ đầu — mua domain, thuê VPS, cài đặt server, đến deploy và vận hành ổn định.

---

## Mục lục

1. [Tổng quan kiến trúc Production](#1-tổng-quan-kiến-trúc-production)
2. [Bước 1 — Mua Domain](#2-bước-1--mua-domain)
3. [Bước 2 — Thuê VPS](#3-bước-2--thuê-vps)
4. [Bước 3 — Kết nối VPS lần đầu](#4-bước-3--kết-nối-vps-lần-đầu)
5. [Bước 4 — Cài đặt môi trường server](#5-bước-4--cài-đặt-môi-trường-server)
6. [Bước 5 — Cấu hình PostgreSQL](#6-bước-5--cấu-hình-postgresql)
7. [Bước 6 — Upload code lên server](#7-bước-6--upload-code-lên-server)
8. [Bước 7 — Cấu hình biến môi trường (.env)](#8-bước-7--cấu-hình-biến-môi-trường-env)
9. [Bước 8 — Chạy ứng dụng với PM2](#9-bước-8--chạy-ứng-dụng-với-pm2)
10. [Bước 9 — Cài Nginx làm Reverse Proxy](#10-bước-9--cài-nginx-làm-reverse-proxy)
11. [Bước 10 — Trỏ Domain về VPS & cài SSL](#11-bước-10--trỏ-domain-về-vps--cài-ssl)
12. [Bước 11 — Backup Database tự động](#12-bước-11--backup-database-tự-động)
13. [Bước 12 — Giám sát & Vận hành hàng ngày](#13-bước-12--giám-sát--vận-hành-hàng-ngày)
14. [Checklist cuối cùng](#14-checklist-cuối-cùng)

---

## 1. Tổng quan kiến trúc Production

```
[Người dùng]
     │  HTTPS (port 443)
     ▼
[Nginx] ← reverse proxy, SSL termination
     │  HTTP nội bộ (port 3000)
     ▼
[Node.js App] ← quản lý bởi PM2
     │
     ▼
[PostgreSQL] ← chạy local trên VPS
     │
     ▼
[Cloudinary] ← lưu trữ ảnh sản phẩm (cloud)
```

**Giải thích ngắn:**
- **Nginx**: tiếp nhận request từ internet, chuyển tiếp về app Node.js
- **PM2**: đảm bảo app tự khởi động lại khi crash, hoặc khi VPS reboot
- **Certbot**: cấp SSL miễn phí từ Let's Encrypt (HTTPS)
- **PostgreSQL**: database chạy trực tiếp trên VPS

---

## 2. Bước 1 — Mua Domain

### Gợi ý nhà cung cấp domain

| Nhà cung cấp | Link | Ghi chú |
|---|---|---|
| **Namecheap** | namecheap.com | Phổ biến, giá tốt, giao diện dễ dùng |
| **Tenten.vn** | tenten.vn | Nhà cung cấp Việt Nam, hỗ trợ tiếng Việt |
| **Inet.vn** | inet.vn | Uy tín tại VN, có hỗ trợ qua điện thoại |
| **GoDaddy** | godaddy.com | Lớn nhất thế giới, nhiều khuyến mãi năm đầu |

### Cách chọn tên domain
- Ngắn gọn, dễ nhớ. Ví dụ: `hoaquanhapkhau.vn`, `fruithub.vn`
- Ưu tiên đuôi `.vn` (khách hàng Việt Nam tin tưởng hơn)
- Tránh dùng dấu gạch nối nhiều lần

### Mua domain trên Namecheap (ví dụ)
1. Vào **namecheap.com** → Tìm kiếm tên miền mong muốn
2. Thêm vào giỏ hàng → Thanh toán (có thể dùng PayPal hoặc thẻ quốc tế)
3. Sau khi mua, vào **Account → Dashboard → Domain List** để quản lý

---

## 3. Bước 2 — Thuê VPS

### Gợi ý nhà cung cấp VPS (phù hợp người mới, giá rẻ)

| Nhà cung cấp | Giá khởi điểm | Ghi chú |
|---|---|---|
| **DigitalOcean** | ~$6/tháng | Giao diện đẹp, dễ dùng nhất cho người mới |
| **Vultr** | ~$6/tháng | Giá tốt, nhiều datacenter |
| **Linode (Akamai)** | ~$5/tháng | Ổn định, tài liệu tốt |
| **Viettel IDC** | Liên hệ | Datacenter VN, ping thấp cho user VN |
| **BizFly Cloud** | ~100k/tháng | Nhà cung cấp VN, hỗ trợ tiếng Việt |

### Cấu hình tối thiểu cho WebHoaQua

| Thành phần | Tối thiểu | Khuyến nghị |
|---|---|---|
| CPU | 1 vCPU | 2 vCPU |
| RAM | 1 GB | 2 GB |
| Ổ cứng | 25 GB SSD | 50 GB SSD |
| Hệ điều hành | **Ubuntu 22.04 LTS** | Ubuntu 22.04 LTS |

> **Lưu ý:** Luôn chọn **Ubuntu 22.04 LTS** — đây là phiên bản ổn định nhất hiện tại và được hỗ trợ đến 2027.

### Tạo VPS trên DigitalOcean (ví dụ)
1. Đăng ký tại **digitalocean.com** (có thể dùng GitHub để đăng nhập nhanh)
2. Nhấn **Create → Droplet**
3. Chọn:
   - Region: **Singapore** (gần Việt Nam nhất)
   - OS: **Ubuntu 22.04 LTS**
   - Plan: **Basic → $6/tháng** (1 vCPU, 1GB RAM, 25GB SSD)
4. Authentication: Chọn **SSH Key** (bảo mật hơn password)
   - Nếu chưa có SSH key, chọn **Password** để đơn giản hơn lúc đầu
5. Nhấn **Create Droplet** → Chờ ~1 phút
6. Ghi lại **IP address** của VPS (ví dụ: `123.45.67.89`)

---

## 4. Bước 3 — Kết nối VPS lần đầu

### Trên Windows — Dùng PowerShell hoặc PuTTY

**Cách 1: PowerShell (Windows 10/11 đã có sẵn)**
```powershell
ssh root@123.45.67.89
# Thay 123.45.67.89 bằng IP VPS của bạn
# Nhập password khi được hỏi
```

**Cách 2: PuTTY (tải tại putty.org)**
- Host Name: `123.45.67.89`
- Port: `22`
- Connection type: SSH
- Nhấn Open → Nhập `root` → Nhập password

### Tạo user mới (không dùng root thường xuyên — an toàn hơn)
```bash
# Tạo user mới tên "deploy"
adduser deploy

# Cấp quyền sudo cho user đó
usermod -aG sudo deploy

# Chuyển sang user mới để kiểm tra
su - deploy
```

> Từ đây, tất cả lệnh đều chạy với user `deploy`, dùng `sudo` khi cần quyền root.

---

## 5. Bước 4 — Cài đặt môi trường server

Chạy lần lượt từng lệnh sau sau khi đã SSH vào VPS:

### 4.1. Cập nhật hệ thống
```bash
sudo apt update && sudo apt upgrade -y
```

### 4.2. Cài Node.js 18 (LTS)
```bash
# Thêm NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Cài Node.js
sudo apt install -y nodejs

# Kiểm tra phiên bản
node -v   # Phải hiện v18.x.x
npm -v    # Phải hiện 9.x.x hoặc 10.x.x
```

### 4.3. Cài Git
```bash
sudo apt install -y git

# Kiểm tra
git --version
```

### 4.4. Cài PM2 (quản lý process Node.js)
```bash
sudo npm install -g pm2

# Kiểm tra
pm2 --version
```

### 4.5. Cài Nginx (web server / reverse proxy)
```bash
sudo apt install -y nginx

# Khởi động Nginx
sudo systemctl start nginx
sudo systemctl enable nginx  # Tự khởi động khi VPS reboot

# Kiểm tra — mở trình duyệt, nhập IP VPS, phải thấy trang "Welcome to nginx"
```

---

## 6. Bước 5 — Cài đặt PostgreSQL

### 5.1. Cài PostgreSQL
```bash
sudo apt install -y postgresql postgresql-contrib

# Khởi động
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 5.2. Tạo database và user cho ứng dụng
```bash
# Chuyển sang user postgres
sudo -i -u postgres

# Mở PostgreSQL shell
psql
```

Trong PostgreSQL shell, chạy từng lệnh sau:
```sql
-- Tạo user mới (thay "mat_khau_manh" bằng mật khẩu thật của bạn)
CREATE USER hoaqua_user WITH PASSWORD 'mat_khau_manh';

-- Tạo database
CREATE DATABASE web_hoaqua OWNER hoaqua_user;

-- Cấp quyền
GRANT ALL PRIVILEGES ON DATABASE web_hoaqua TO hoaqua_user;

-- Thoát
\q
```

```bash
# Thoát khỏi user postgres
exit
```

### 5.3. Kiểm tra kết nối
```bash
psql -U hoaqua_user -d web_hoaqua -h localhost
# Nhập password → nếu vào được là thành công
# Thoát: \q
```

---

## 7. Bước 6 — Upload code lên server

### Cách 1: Clone từ GitHub (Khuyến nghị)

**Trên máy local (Windows) — Push code lên GitHub trước:**
```bash
# Trong thư mục dự án
git add .
git commit -m "feat: ready for production"
git push origin main
```

**Trên VPS:**
```bash
# Di chuyển đến thư mục web
cd /var/www

# Clone project (thay bằng link repo của bạn)
sudo git clone https://github.com/your-username/WebHoaQua.git hoaqua

# Phân quyền cho user deploy
sudo chown -R deploy:deploy /var/www/hoaqua

# Vào thư mục project
cd /var/www/hoaqua

# Cài dependencies (không cài devDependencies)
npm install --omit=dev
```

### Cách 2: Upload trực tiếp bằng FileZilla (nếu chưa dùng Git)
1. Tải **FileZilla Client** tại filezilla-project.org
2. Kết nối:
   - Host: `sftp://123.45.67.89`
   - Username: `deploy`
   - Password: (password VPS)
   - Port: `22`
3. Upload toàn bộ thư mục dự án lên `/var/www/hoaqua`
4. SSH vào VPS → `cd /var/www/hoaqua` → `npm install --omit=dev`

> **Quan trọng:** Đừng upload thư mục `node_modules/` — rất nặng và không cần thiết.

### Cập nhật `.gitignore` trước khi push
Đảm bảo file `.gitignore` có những dòng sau:
```
node_modules/
.env
logs/
tmp/
```

---

## 8. Bước 7 — Cấu hình biến môi trường (.env)

File `.env` **không** được commit lên Git. Bạn phải tạo trực tiếp trên server.

```bash
# Trên VPS, trong thư mục project
cd /var/www/hoaqua
nano .env
```

Điền nội dung vào file `.env` production:
```env
# Server
PORT=3000
NODE_ENV=production

# Database (dùng thông tin đã tạo ở Bước 5)
DATABASE_URL="postgresql://hoaqua_user:mat_khau_manh@localhost:5432/web_hoaqua?schema=public"

# Session (tạo chuỗi ngẫu nhiên dài, ví dụ 64 ký tự)
SESSION_SECRET="day_la_chuoi_bi_mat_rat_dai_va_ngau_nhien_thay_bang_chuoi_that"

# JWT (nếu dùng)
JWT_SECRET="day_la_jwt_secret_cua_ban"

# Cloudinary (lấy từ dashboard.cloudinary.com)
CLOUDINARY_CLOUD_NAME="ten_cloud_cua_ban"
CLOUDINARY_API_KEY="api_key_cua_ban"
CLOUDINARY_API_SECRET="api_secret_cua_ban"

# Email (nếu dùng nodemailer)
MAIL_HOST="smtp.gmail.com"
MAIL_PORT=587
MAIL_USER="email@gmail.com"
MAIL_PASS="app_password_gmail"
```

**Lưu file:** `Ctrl+X` → `Y` → `Enter`

> **Tạo SESSION_SECRET ngẫu nhiên:** Chạy lệnh sau để lấy chuỗi ngẫu nhiên 64 ký tự:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

---

## 9. Bước 8 — Chạy ứng dụng với PM2

### 8.1. Chạy migration database
```bash
cd /var/www/hoaqua

# Generate Prisma client
npx prisma generate

# Chạy migration (tạo bảng trong DB)
npx prisma migrate deploy

# (Tuỳ chọn) Seed dữ liệu danh mục ban đầu
node prisma/seed.js
```

### 8.2. Khởi động ứng dụng với PM2
```bash
# Khởi động với profile production (dùng ecosystem.config.js đã có sẵn)
npm run pm2:prod

# Hoặc chạy trực tiếp:
pm2 start ecosystem.config.js --only WebHoaQua-Prod --env production
```

### 8.3. Kiểm tra ứng dụng đang chạy
```bash
pm2 list
# Phải thấy WebHoaQua-Prod với status "online"

pm2 logs WebHoaQua-Prod --lines 50
# Xem 50 dòng log gần nhất, kiểm tra không có lỗi

# Kiểm tra app chạy ở port 3000
curl http://localhost:3000
# Phải trả về HTML của trang chủ
```

### 8.4. Cấu hình PM2 tự khởi động khi VPS reboot
```bash
pm2 startup
# Lệnh này sẽ in ra một lệnh sudo khác, copy và chạy lệnh đó

# Sau khi chạy xong, lưu danh sách process hiện tại
pm2 save
```

---

## 10. Bước 9 — Cài Nginx làm Reverse Proxy

### 9.1. Tạo file cấu hình Nginx cho website
```bash
sudo nano /etc/nginx/sites-available/hoaqua
```

Dán nội dung sau (thay `yourdomain.com` bằng domain thật của bạn):
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Giới hạn kích thước upload (cho ảnh sản phẩm)
    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Cache file tĩnh (ảnh, CSS, JS)
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2)$ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
```

**Lưu:** `Ctrl+X` → `Y` → `Enter`

### 9.2. Kích hoạt cấu hình và kiểm tra
```bash
# Tạo symlink để kích hoạt
sudo ln -s /etc/nginx/sites-available/hoaqua /etc/nginx/sites-enabled/

# Kiểm tra cấu hình không có lỗi
sudo nginx -t
# Phải hiện: "syntax is ok" và "test is successful"

# Reload Nginx
sudo systemctl reload nginx
```

---

## 11. Bước 10 — Trỏ Domain về VPS & cài SSL

### 10.1. Trỏ domain về IP của VPS

Vào trang quản lý domain của bạn (Namecheap / Tenten...) → Tìm **DNS Management** hoặc **Advanced DNS**:

Thêm 2 bản ghi DNS:

| Type | Host | Value | TTL |
|---|---|---|---|
| A Record | `@` | `123.45.67.89` (IP VPS) | Automatic |
| A Record | `www` | `123.45.67.89` (IP VPS) | Automatic |

> **Lưu ý:** DNS cần 5 phút đến 48 giờ để cập nhật trên toàn cầu. Kiểm tra tại: https://dnschecker.org

### 10.2. Cài SSL miễn phí với Certbot (Let's Encrypt)
```bash
# Cài Certbot và plugin Nginx
sudo apt install -y certbot python3-certbot-nginx

# Cấp SSL (thay bằng domain thật — chờ DNS propagate xong mới làm bước này)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot sẽ hỏi:
- Email: nhập email thật để nhận thông báo hết hạn
- Agree to terms: `A`
- Share email with EFF: tuỳ ý (`Y` hoặc `N`)
- Redirect: Chọn `2` (Redirect HTTP → HTTPS tự động)

### 10.3. Kiểm tra SSL
```bash
# Kiểm tra gia hạn SSL tự động hoạt động
sudo certbot renew --dry-run
# Phải hiện "Congratulations, all simulated renewals succeeded"
```

**Mở trình duyệt:** Truy cập `https://yourdomain.com` → Phải thấy 🔒 xanh và trang web hiển thị bình thường.

---

## 12. Bước 11 — Backup Database tự động

### 11.1. Tạo script backup
```bash
sudo mkdir -p /var/backups/hoaqua
sudo chown deploy:deploy /var/backups/hoaqua

nano /home/deploy/backup_db.sh
```

Dán nội dung sau:
```bash
#!/bin/bash

# Cấu hình
DB_USER="hoaqua_user"
DB_NAME="web_hoaqua"
BACKUP_DIR="/var/backups/hoaqua"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.sql.gz"

# Thực hiện backup và nén
PGPASSWORD="mat_khau_manh" pg_dump -U $DB_USER -h localhost $DB_NAME | gzip > $BACKUP_FILE

# Xoá backup cũ hơn 7 ngày
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup thành công: $BACKUP_FILE"
```

```bash
# Cấp quyền thực thi
chmod +x /home/deploy/backup_db.sh

# Chạy thử
/home/deploy/backup_db.sh
# Phải hiện: "Backup thành công: /var/backups/hoaqua/backup_..."

# Kiểm tra file backup đã tạo
ls -lh /var/backups/hoaqua/
```

### 11.2. Đặt lịch backup tự động mỗi ngày lúc 2:00 AM
```bash
crontab -e
# Chọn editor: 1 (nano)
```

Thêm dòng sau vào cuối file:
```
0 2 * * * /home/deploy/backup_db.sh >> /home/deploy/backup.log 2>&1
```

**Lưu:** `Ctrl+X` → `Y` → `Enter`

### 11.3. Khôi phục database từ backup (khi cần)
```bash
# Giải nén và restore
gunzip -c /var/backups/hoaqua/backup_YYYYMMDD_HHMMSS.sql.gz | \
  psql -U hoaqua_user -h localhost web_hoaqua
```

---

## 13. Bước 12 — Giám sát & Vận hành hàng ngày

### Các lệnh PM2 thường dùng

```bash
# Xem trạng thái tất cả process
pm2 list

# Xem log realtime
pm2 logs WebHoaQua-Prod

# Xem log realtime với số lượng dòng cụ thể
pm2 logs WebHoaQua-Prod --lines 100

# Xem dashboard PM2 (realtime CPU/RAM)
pm2 monit

# Restart app (sau khi cập nhật code)
pm2 restart WebHoaQua-Prod

# Reload không downtime (0s downtime)
pm2 reload WebHoaQua-Prod

# Xoá log cũ
pm2 flush
```

### Quy trình cập nhật code (Deploy mới)

Mỗi khi cần cập nhật code mới lên production:

```bash
# 1. SSH vào VPS
ssh deploy@123.45.67.89

# 2. Vào thư mục project
cd /var/www/hoaqua

# 3. Pull code mới
git pull origin main

# 4. Cài dependencies mới (nếu có thêm package)
npm install --omit=dev

# 5. Nếu có thay đổi schema Prisma
npx prisma migrate deploy
npx prisma generate

# 6. Reload app (không downtime)
pm2 reload WebHoaQua-Prod

# 7. Kiểm tra log xem có lỗi không
pm2 logs WebHoaQua-Prod --lines 30
```

### Mở port Firewall (nếu cần)
```bash
# Kiểm tra trạng thái firewall
sudo ufw status

# Cho phép SSH, HTTP, HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'

# Bật firewall
sudo ufw enable
```

### Kiểm tra tài nguyên server
```bash
# CPU và RAM
htop
# Hoặc: free -h (RAM), top (tổng quan)

# Dung lượng ổ cứng
df -h

# Kiểm tra Nginx
sudo systemctl status nginx

# Kiểm tra PostgreSQL
sudo systemctl status postgresql
```

---

## 14. Checklist cuối cùng

### Trước khi go-live

- [ ] Domain đã mua và DNS đã trỏ về IP VPS
- [ ] VPS đang chạy Ubuntu 22.04 LTS
- [ ] Node.js 18, PM2, Nginx, PostgreSQL đã cài đặt
- [ ] Database `web_hoaqua` đã tạo với user riêng
- [ ] Code đã clone/upload lên `/var/www/hoaqua`
- [ ] File `.env` production đã tạo với thông tin thật
- [ ] `npx prisma migrate deploy` đã chạy thành công
- [ ] Dữ liệu test đã xoá sạch, chỉ giữ seed danh mục
- [ ] PM2 đã khởi động `WebHoaQua-Prod` với status `online`
- [ ] PM2 startup đã cài (`pm2 startup` + `pm2 save`)
- [ ] Nginx cấu hình đúng, `nginx -t` không báo lỗi
- [ ] SSL đã cài qua Certbot — website hiển thị HTTPS 🔒
- [ ] `certbot renew --dry-run` thành công
- [ ] Script backup database đã tạo và chạy thử OK
- [ ] Cron job backup 2:00 AM hàng ngày đã đặt

### Kiểm tra chức năng cuối cùng

- [ ] Trang chủ hiển thị đúng, ảnh sản phẩm load được
- [ ] Đăng ký / Đăng nhập hoạt động
- [ ] Thêm sản phẩm vào giỏ hàng và đặt hàng thành công
- [ ] Upload ảnh sản phẩm lên Cloudinary thành công (kiểm tra trong Admin)
- [ ] Trang Admin truy cập được và các chức năng hoạt động
- [ ] Email gửi đi hoạt động (nếu có nodemailer)
- [ ] HTTPS redirect tự động từ HTTP

---

## Ghi chú vận hành

### Xem log lỗi khi có sự cố
```bash
# PM2 log
pm2 logs WebHoaQua-Prod --err --lines 100

# Nginx access/error log
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Gia hạn SSL (tự động — chỉ kiểm tra)
Certbot tự gia hạn qua cron job. Kiểm tra thủ công:
```bash
sudo certbot renew --dry-run
```

### Thông tin đăng nhập cần lưu trữ an toàn
Lưu các thông tin sau ở nơi an toàn (không lưu trong code):
- IP VPS
- Password VPS / SSH key
- Password database PostgreSQL
- Cloudinary API credentials
- Session Secret và JWT Secret
- Tài khoản đăng nhập nhà cung cấp domain và VPS
