# Hướng dẫn Self-Host n8n Miễn Phí trên VPS

> **Phù hợp với:** VPS đang chạy Ubuntu 22.04, Nginx, PM2 — không cần mua thêm gì.  
> **Kết quả:** n8n chạy 24/7 tại subdomain riêng (vd: `n8n.haianhfruit.com`) với HTTPS miễn phí.

---

## Mục lục

1. [n8n là gì và tại sao nên self-host?](#1-n8n-là-gì-và-tại-sao-nên-self-host)
2. [Yêu cầu trước khi bắt đầu](#2-yêu-cầu-trước-khi-bắt-đầu)
3. [Bước 1 — Cài đặt n8n](#3-bước-1--cài-đặt-n8n)
4. [Bước 2 — Cấu hình biến môi trường](#4-bước-2--cấu-hình-biến-môi-trường)
5. [Bước 3 — Chạy n8n bằng PM2](#5-bước-3--chạy-n8n-bằng-pm2)
6. [Bước 4 — Trỏ subdomain DNS](#6-bước-4--trỏ-subdomain-dns)
7. [Bước 5 — Cấu hình Nginx Reverse Proxy](#7-bước-5--cấu-hình-nginx-reverse-proxy)
8. [Bước 6 — Cài SSL (HTTPS) cho n8n](#8-bước-6--cài-ssl-https-cho-n8n)
9. [Bước 7 — Đăng nhập và thiết lập tài khoản](#9-bước-7--đăng-nhập-và-thiết-lập-tài-khoản)
10. [Bảo trì và vận hành](#10-bảo-trì-và-vận-hành)
11. [Checklist hoàn thành](#11-checklist-hoàn-thành)

---

## 1. n8n là gì và tại sao nên self-host?

**n8n** là công cụ **workflow automation** (tự động hóa luồng công việc) mã nguồn mở — tương tự Zapier hay Make.com — nhưng bạn có thể tự host miễn phí.

### So sánh: Cloud vs Self-host

| Tiêu chí | n8n Cloud (trả phí) | Self-host (miễn phí) |
|---|---|---|
| Giá | $24/tháng trở lên | **$0** (dùng VPS sẵn có) |
| Số workflow | Giới hạn | **Không giới hạn** |
| Số executions | Giới hạn | **Không giới hạn** |
| Dữ liệu | Lưu trên cloud n8n | **Lưu trên VPS của bạn** |
| Bảo mật | Phụ thuộc n8n Inc. | **Hoàn toàn kiểm soát** |
| Cài đặt | Không cần | Cần ~30 phút |

### Ứng dụng thực tế cho Hải Anh Fruit
- 📦 Tự động gửi email xác nhận đơn hàng
- 📊 Gửi báo cáo doanh thu hàng ngày qua email/Zalo
- 🔔 Thông báo khi có đơn hàng mới
- 📱 Kết nối Zalo OA / Facebook Messenger
- 🗂️ Đồng bộ dữ liệu với Google Sheets

---

## 2. Yêu cầu trước khi bắt đầu

✅ VPS Ubuntu 22.04 đang chạy  
✅ Nginx đã cài và đang hoạt động  
✅ PM2 đã cài (`pm2 --version` để kiểm tra)  
✅ Đã có domain (vd: `haianhfruit.com`)  
✅ Node.js 18+ đã cài (`node -v` để kiểm tra)

> **Lưu ý RAM:** n8n cần tối thiểu **512MB RAM** để chạy ổn. Nếu VPS chỉ có 1GB RAM và đang chạy cả Node.js app + PostgreSQL, hãy đảm bảo server không quá tải.  
> Kiểm tra RAM hiện tại: `free -h`

---

## 3. Bước 1 — Cài đặt n8n

SSH vào VPS của bạn, sau đó chạy các lệnh sau:

```bash
# Cài n8n global qua npm
sudo npm install -g n8n

# Kiểm tra version vừa cài
n8n --version
# Phải hiện ra số version (vd: 1.x.x)
```

> **Tại sao dùng npm thay vì Docker?**  
> Vì VPS của bạn đã có Node.js + PM2, cài qua npm là nhanh nhất, không cần cài thêm Docker. Cách này cũng nhẹ hơn (tiết kiệm RAM).

---

## 4. Bước 2 — Cấu hình biến môi trường

Tạo thư mục riêng để chứa dữ liệu và config của n8n:

```bash
# Tạo thư mục lưu dữ liệu n8n
mkdir -p /home/deploy/.n8n

# Tạo file .env cho n8n
nano /home/deploy/.n8n/n8n.env
```

Dán nội dung sau vào file (thay các giá trị `YourDomain` và `your_...`):

```env
# ===================================================
# CẤU HÌNH CƠ BẢN N8N
# ===================================================

# URL công khai của n8n (thay bằng subdomain của bạn)
N8N_HOST=n8n.haianhfruit.com
N8N_PORT=5678
N8N_PROTOCOL=https
WEBHOOK_URL=https://n8n.haianhfruit.com/

# Múi giờ Việt Nam
GENERIC_TIMEZONE=Asia/Ho_Chi_Minh

# ===================================================
# BẢO MẬT — QUAN TRỌNG
# ===================================================

# Mật khẩu mã hóa credentials (bắt buộc, tạo chuỗi ngẫu nhiên)
N8N_ENCRYPTION_KEY=^SvH56kq+UCj%K5am&q5TdcHBVFKS+47WWTGq^T473dy9ws%eIgsx5zDAuhjXSIw

# Kích hoạt xác thực cơ bản (tài khoản/mật khẩu đăng nhập n8n)
# Bỏ qua nếu bạn muốn dùng tài khoản n8n khi vào lần đầu
# N8N_BASIC_AUTH_ACTIVE=true
# N8N_BASIC_AUTH_USER=admin
# N8N_BASIC_AUTH_PASSWORD=your_strong_password

# ===================================================
# CƠ SỞ DỮ LIỆU (SQLite mặc định — đủ dùng)
# ===================================================

# n8n mặc định dùng SQLite, lưu tại ~/.n8n/database.sqlite
# Không cần cấu hình thêm gì, hoạt động luôn

# (Tuỳ chọn nâng cao) Nếu muốn dùng PostgreSQL (cùng server):
# DB_TYPE=postgresdb
# DB_POSTGRESDB_HOST=localhost
# DB_POSTGRESDB_PORT=5432
# DB_POSTGRESDB_DATABASE=n8n_db
# DB_POSTGRESDB_USER=n8n_user
# DB_POSTGRESDB_PASSWORD=your_db_password

# ===================================================
# HIỆU SUẤT
# ===================================================

# Giới hạn số workflows chạy đồng thời (tiết kiệm RAM)
EXECUTIONS_PROCESS=main
N8N_DEFAULT_CONCURRENCY=5

# Tự xoá lịch sử execution sau 30 ngày (tiết kiệm ổ cứng)
EXECUTIONS_DATA_PRUNE=true
EXECUTIONS_DATA_MAX_AGE=720
```

**Lưu file:** `Ctrl+X` → `Y` → `Enter`

### Tạo N8N_ENCRYPTION_KEY ngẫu nhiên

```bash
# Tạo chuỗi ngẫu nhiên 32 ký tự để làm encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy kết quả và thay vào `your_very_long_random_encryption_key_here` trong file `.env`.

> ⚠️ **Quan trọng:** Lưu `N8N_ENCRYPTION_KEY` ở nơi an toàn. Nếu mất key này, bạn sẽ không thể giải mã các credentials đã lưu trong n8n.

---

## 5. Bước 3 — Chạy n8n bằng PM2

### 5.1. Tạo file PM2 ecosystem cho n8n

```bash
nano /home/deploy/n8n-ecosystem.config.js
```

Dán nội dung sau:

```javascript
module.exports = {
  apps: [
    {
      name: 'n8n',
      script: 'n8n',
      // Tìm đường dẫn n8n: chạy `which n8n` rồi điền vào đây nếu cần
      // script: '/usr/local/bin/n8n',
      args: 'start',
      cwd: '/home/deploy',

      // Không tự restart khi crash (tránh vòng lặp lỗi)
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',

      // Load biến môi trường từ file .env
      env: {
        NODE_ENV: 'production',
      },
      env_file: '/home/deploy/.n8n/n8n.env',

      // Log
      error_file: '/home/deploy/.n8n/logs/n8n-error.log',
      out_file: '/home/deploy/.n8n/logs/n8n-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
```

**Lưu file:** `Ctrl+X` → `Y` → `Enter`

### 5.2. Tạo thư mục log và khởi động n8n

```bash
# Tạo thư mục log
mkdir -p /home/deploy/.n8n/logs

# Khởi động n8n
pm2 start /home/deploy/n8n-ecosystem.config.js

# Kiểm tra n8n đang chạy
pm2 list
# Phải thấy "n8n" với status "online"

# Xem log để đảm bảo không có lỗi
pm2 logs n8n --lines 30
# Bạn sẽ thấy dòng: "n8n ready on port 5678"
```

### 5.3. Lưu cấu hình PM2 (để tự khởi động khi VPS reboot)

```bash
# Lưu danh sách process (bao gồm n8n vừa thêm)
pm2 save

# Kiểm tra startup đã được cài trước đó chưa
# Nếu chưa: pm2 startup → chạy lệnh được in ra → pm2 save
```

### 5.4. Kiểm tra n8n chạy ở port 5678

```bash
curl http://localhost:5678
# Phải trả về HTML của trang n8n (hoặc redirect)
```

---

## 6. Bước 4 — Trỏ Subdomain DNS

Vào trang quản lý domain của bạn (**Tenten.vn** → DNS Management):

Thêm **1 bản ghi A Record** mới:

| Type | Host | Value | TTL |
|---|---|---|---|
| A Record | `n8n` | `IP_VPS_CỦA_BẠN` | Automatic |

> Ví dụ: Nếu IP VPS là `123.45.67.89`, thì Value = `123.45.67.89`  
> Subdomain kết quả: `n8n.haianhfruit.com`

Kiểm tra DNS đã cập nhật chưa (chờ 5–15 phút):
```bash
# Kiểm tra từ VPS
nslookup n8n.haianhfruit.com
# Phải trả về IP VPS của bạn
```

---

## 7. Bước 5 — Cấu hình Nginx Reverse Proxy

### 7.1. Tạo file cấu hình Nginx cho n8n

```bash
sudo nano /etc/nginx/sites-available/n8n
```

Dán nội dung sau (thay `n8n.haianhfruit.com` bằng subdomain của bạn):

```nginx
server {
    listen 80;
    server_name n8n.haianhfruit.com;

    # Giới hạn upload (cho workflow nhận file)
    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:5678;
        proxy_http_version 1.1;

        # Headers cần thiết cho n8n
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeout dài hơn cho các workflow chạy lâu
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
    }
}
```

**Lưu:** `Ctrl+X` → `Y` → `Enter`

### 7.2. Kích hoạt và kiểm tra cấu hình

```bash
# Tạo symlink để kích hoạt
sudo ln -s /etc/nginx/sites-available/n8n /etc/nginx/sites-enabled/

# Kiểm tra cú pháp Nginx
sudo nginx -t
# Phải hiện: "syntax is ok" và "test is successful"

# Reload Nginx
sudo systemctl reload nginx
```

---

## 8. Bước 6 — Cài SSL (HTTPS) cho n8n

> Thực hiện bước này **sau khi** DNS đã cập nhật (subdomain trỏ về đúng IP VPS).

```bash
# Cấp SSL cho subdomain n8n
sudo certbot --nginx -d n8n.haianhfruit.com
```

Certbot sẽ hỏi:
- Email: nhập email thật (nhận thông báo hết hạn)
- Agree to terms: `A`
- Share email: tuỳ ý
- Redirect HTTP → HTTPS: chọn `2` ✅

### Kiểm tra SSL

```bash
sudo certbot renew --dry-run
# Phải hiện "Congratulations, all simulated renewals succeeded"
```

Mở trình duyệt, vào: **`https://n8n.haianhfruit.com`**  
Phải thấy 🔒 xanh và giao diện đăng nhập n8n.

---

## 9. Bước 7 — Đăng nhập và thiết lập tài khoản

### 9.1. Đăng nhập lần đầu

Truy cập `https://n8n.haianhfruit.com` trên trình duyệt.

n8n sẽ hiển thị màn hình **Setup** để tạo tài khoản chủ:
1. Nhập **Email**, **First Name**, **Last Name**
2. Đặt **Password** mạnh
3. Nhấn **Next** → Bỏ qua phần community edition setup nếu muốn

> **Lưu tài khoản này cẩn thận** — đây là tài khoản admin duy nhất của n8n.

### 9.2. Thiết lập cơ bản sau khi đăng nhập

1. Vào **Settings → Personal** → Cập nhật thông tin
2. Vào **Settings → Community Nodes** → Tắt nếu không cần
3. Kích hoạt **2FA** (Two-Factor Authentication) nếu muốn bảo mật hơn

### 9.3. Test workflow đầu tiên

1. Nhấn **New Workflow**
2. Kéo node **Manual Trigger** vào canvas
3. Nhấn **Execute Workflow** → Nếu chạy thành công là n8n đã hoạt động hoàn hảo ✅

---

## 10. Bảo trì và vận hành

### Các lệnh PM2 thường dùng

```bash
# Xem trạng thái n8n
pm2 list

# Xem log realtime
pm2 logs n8n

# Xem log lỗi
pm2 logs n8n --err --lines 50

# Restart n8n
pm2 restart n8n

# Dừng n8n tạm thời
pm2 stop n8n

# Xem tài nguyên CPU/RAM
pm2 monit
```

### Cập nhật n8n lên phiên bản mới

```bash
# Dừng n8n trước
pm2 stop n8n

# Cập nhật n8n
sudo npm update -g n8n

# Kiểm tra version mới
n8n --version

# Khởi động lại
pm2 start n8n
pm2 save
```

> ⚠️ **Trước khi cập nhật:** Đọc [n8n release notes](https://github.com/n8n-io/n8n/releases) để kiểm tra breaking changes.

### Backup dữ liệu n8n

Dữ liệu n8n (workflows, credentials, executions) được lưu tại `/home/deploy/.n8n/`.

```bash
# Backup thủ công toàn bộ thư mục n8n
tar -czf /var/backups/hoaqua/n8n-backup-$(date +%Y%m%d).tar.gz /home/deploy/.n8n/

# Lên lịch backup tự động hàng ngày lúc 3:00 AM
crontab -e
# Thêm dòng:
# 0 3 * * * tar -czf /var/backups/hoaqua/n8n-backup-$(date +\%Y\%m\%d).tar.gz /home/deploy/.n8n/ 2>&1
```

### Khôi phục từ backup

```bash
# Dừng n8n trước
pm2 stop n8n

# Xoá dữ liệu cũ (cẩn thận)
rm -rf /home/deploy/.n8n/database.sqlite

# Giải nén backup
tar -xzf /var/backups/hoaqua/n8n-backup-YYYYMMDD.tar.gz -C /

# Khởi động lại
pm2 start n8n
```

### Giám sát tài nguyên server

Vì VPS đang chạy cả **WebHoaQua app** + **PostgreSQL** + **n8n**, hãy theo dõi RAM thường xuyên:

```bash
# Kiểm tra RAM
free -h

# Kiểm tra tất cả process
pm2 list

# Nếu RAM < 200MB free thường xuyên, cần nâng cấp VPS lên 2GB
```

---

## 11. Checklist hoàn thành

### Cài đặt

- [ ] `n8n` đã cài qua npm (`n8n --version` trả về số version)
- [ ] File `/home/deploy/.n8n/n8n.env` đã tạo với `N8N_ENCRYPTION_KEY` ngẫu nhiên
- [ ] File `n8n-ecosystem.config.js` đã tạo
- [ ] PM2 đã start n8n — `pm2 list` hiện status `online`
- [ ] `pm2 save` đã chạy để lưu cấu hình

### Networking

- [ ] DNS A Record `n8n.haianhfruit.com` → IP VPS đã thêm
- [ ] DNS đã propagate (`nslookup n8n.haianhfruit.com` trả về đúng IP)
- [ ] File cấu hình Nginx `/etc/nginx/sites-available/n8n` đã tạo
- [ ] Symlink đã tạo tại `/etc/nginx/sites-enabled/n8n`
- [ ] `sudo nginx -t` không báo lỗi
- [ ] `sudo systemctl reload nginx` thành công

### HTTPS

- [ ] `sudo certbot --nginx -d n8n.haianhfruit.com` thành công
- [ ] Truy cập `https://n8n.haianhfruit.com` thấy 🔒 xanh
- [ ] `sudo certbot renew --dry-run` thành công

### Hoạt động

- [ ] Đã tạo tài khoản admin lần đầu
- [ ] Đã chạy test workflow đơn giản thành công
- [ ] Backup script cho `/home/deploy/.n8n/` đã thiết lập

---

## Lưu ý quan trọng

### Port Firewall

Nếu VPS có UFW firewall, n8n chạy nội bộ (localhost:5678) và Nginx làm proxy — **không cần mở port 5678 ra ngoài**:

```bash
# KHÔNG cần chạy lệnh này:
# sudo ufw allow 5678  ← KHÔNG MỞ PORT NÀY

# Nginx Full (port 80 + 443) đã được mở là đủ
sudo ufw status
```

### Tổng quan kiến trúc sau khi cài xong

```
[Internet]
    │
    ├── haianhfruit.com   → Nginx port 443 → Node.js app (port 3000)
    │
    └── n8n.haianhfruit.com → Nginx port 443 → n8n (port 5678)
                                                    │
                                              SQLite database
                                        (/home/deploy/.n8n/database.sqlite)
```

### Chi phí phát sinh

| Thứ | Chi phí |
|---|---|
| n8n bản thân | **Miễn phí** (Community Edition) |
| VPS thêm | **$0** — dùng VPS đang có |
| Domain/Subdomain | **$0** — subdomain miễn phí trên domain đã mua |
| SSL | **$0** — Let's Encrypt miễn phí |
| **Tổng** | **$0** |
