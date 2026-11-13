# Phase 13 — Tổng kết và checklist deploy (S42–S54)

Phạm vi: API đăng bài cho n8n, tin tức ẩn kèm popup affiliate, trang bài viết chuyên nghiệp, tối ưu VPS 1GB, giao diện v2 nền trắng.
Ngày: 2026-11-12. Mọi thay đổi hiện **chưa được commit** vào git.

## 1. Đã làm được gì

| Slice | Nội dung | Tài liệu |
| --- | --- | --- |
| S42 | Schema: `BlogPost` mở rộng (loại bài, token, affiliate, video, gallery...), `ApiKey`, `NewsStatDaily`; migration; lọc `post_type='blog'` | `11_plan_slices/S42.md` |
| S43 | Làm sạch HTML, slug không dấu, kiểm tra link affiliate, video nhúng, upload ảnh/video dạng stream lên Cloudinary | S43.md |
| S44 | API key + `POST/GET/PUT/DELETE /api/v1/posts` (JSON hoặc multipart), chống trùng `external_id`, admin API Keys | `docs/12-api-posts.md` |
| S45 | Admin tin tức ẩn: tạo/sửa/xem trước/đăng/gỡ, sao chép link, cài đặt `news.*`, thống kê | S45.md |
| S46 | Subdomain tin ẩn: chỉ phục vụ `/tin-tuc/{ngày}/{slug}/{token}`, noindex, 404 trung tính, chặn dò | `docs/13-news-subdomain.md` |
| S47 | Popup affiliate (thân popup mở link tab mới, X/nền mờ/Esc chỉ đóng), banner dính, đếm lượt, trang thống kê | S47.md |
| S48 | Trang bài blog: SEO/Open Graph/JSON-LD, mục lục, chia sẻ, sản phẩm và bài liên quan | S48.md |
| S49 | Một PrismaClient duy nhất, cache menu, `/healthz`, PM2 an toàn cho n8n, script sao lưu DB | `docs/14-vps-1gb-operations.md` |
| S50 | Ba bản mẫu giao diện (đã chọn C nền trắng) | `docs/mockups/` |
| S51–S54 | Giao diện v2: layout chung + ngăn kéo giỏ, trang chủ, shop + chi tiết, giỏ hàng + thanh toán | `docs/15-ui-theme-v2.md` |

Kiểm thử tự động: 11 bộ trong `tests/` (S43, S44, S45, S46, S47, S48, S49, S51, S52, S53, S54), tất cả đạt. Chạy từng bộ bằng `node tests/<tên>.test.js` sau khi `npm install` (dùng DB và Cloudinary giả lập, không cần Postgres).

## 2. Việc cần làm TRƯỚC khi deploy (trên máy của bạn)

- [ ] **Commit mã nguồn.** Chưa có gì được commit. Lệnh git ở máy này báo lỗi "dubious ownership" của Windows (thư mục thuộc nhóm Administrators); xử lý bằng `git config --global --add safe.directory "D:/Documents/Tổng kho dev/Web/WebHoaQua"` nếu bạn đồng ý.
- [ ] `npm install` để cài `sanitize-html` (đã thêm vào `package.json`; lần cài trong phiên làm việc bị Windows chặn nên `node_modules` và `package-lock.json` chưa cập nhật). Sau đó chạy lại 11 bộ test.
- [ ] Xóa file tạm `docs/mockups/*.tmp.*` (còn sót, bị khóa quyền xóa; vô hại).
- [ ] Kiểm tra **khóa `N8N_ENCRYPTION_KEY` cũ** trong lịch sử `docs/10-self-host-n8n.md`: nếu là khóa đang dùng thật thì coi như đã lộ, tạo khóa mới và nhập lại credentials n8n (sao lưu `/home/deploy/.n8n/` trước).

## 3. Staging (làm trước production)

Thử toàn bộ trên môi trường có PostgreSQL và Cloudinary thật, vì phần lớn kiểm thử mới chạy với dữ liệu giả.

1. [ ] Sao lưu DB: `node scripts/backup-db.js` (cần `postgresql-client`).
2. [ ] `git pull`, `npm ci --omit=dev`.
3. [ ] `.env`:
   - `SITE_URL="https://haianhfruit.com"`
   - `DATABASE_URL="...?schema=public&connection_limit=5"`
   - `UI_THEME=v2` (hoặc `classic` để tạm giữ giao diện cũ)
   - Cloudinary đã có sẵn.
4. [ ] `npx prisma migrate deploy && npx prisma generate` (migration `20261112100000_news_api_foundation`).
5. [ ] `npx prisma db seed` (nạp cài đặt `news.*`, không ghi đè giá trị đã có).
6. [ ] `npm run pm2:reload`, rồi `curl -s http://127.0.0.1:3000/healthz?db=1` phải trả `"status":"ok","db":"ok"`.
7. [ ] Kiểm tra SQL: `SELECT post_type, count(*) FROM "BlogPost" GROUP BY 1;` phải toàn `blog`.

### Thử chức năng (đánh dấu khi đạt)
- [ ] **Đặt hàng thật**: COD và chuyển khoản (QR), có voucher, điểm thưởng, freeship; xem trang thành công.
- [ ] Giỏ hàng: ngăn kéo, đổi số lượng, xóa; shop: lọc/sắp xếp/phân trang; chi tiết: thêm vào giỏ, thanh mua dính trên điện thoại.
- [ ] Trang chủ với banner admin thật (ảnh ngang có thể bị cắt trong khung vòm; kích thước khuyến nghị ~1000x1250).
- [ ] Admin: **API Keys** (tạo key, thấy một lần, thu hồi), **Tin tức ẩn** (tạo nháp, xem trước, đăng, sao chép link, thống kê, cài đặt).
- [ ] API: tạo bài bằng `curl`/n8n (`docs/12-api-posts.md`): nháp có ảnh, gửi lại cùng `external_id` không tạo trùng, video nhúng YouTube/TikTok.
- [ ] Blog: bài do API đăng hiển thị đúng, mục lục, OG (dán link vào Facebook/Zalo xem ảnh xem trước).
- [ ] Trên điện thoại thật: Safari iOS, Chrome Android, và trình duyệt trong app Facebook/Zalo/TikTok (đặc biệt popup affiliate: bấm thân popup mở tab mới, X chỉ đóng).

## 4. Hạ tầng (xem `docs/14-vps-1gb-operations.md`)

- [ ] Swap 2GB, `vm.swappiness=10`.
- [ ] PostgreSQL gọn nhẹ (`shared_buffers=64MB`, `max_connections=30`...).
- [ ] PM2: `pm2 install pm2-logrotate`, `pm2 save && pm2 startup`; n8n là ứng dụng PM2 riêng, các script `npm run pm2:*` chỉ tác động web.
- [ ] Nginx: gzip, cache file tĩnh, giới hạn đăng nhập, chặn `/api/v1/` từ ngoài (chỉ `127.0.0.1`).
- [ ] **Subdomain tin ẩn** (`docs/13-news-subdomain.md`): bản ghi A `tin` → IP VPS, server block Nginx có `proxy_set_header Host $host`, certbot cho `tin.haianhfruit.com`.
- [ ] Cron sao lưu DB 3h sáng + `RCLONE_REMOTE` để chép ra ngoài VPS; thử khôi phục một lần.
- [ ] Đăng ký `/healthz?db=1` vào dịch vụ giám sát (UptimeRobot...).

## 5. Cấu hình trong admin sau khi lên

1. [ ] **Tin tức ẩn → Cài đặt**: host `tin.haianhfruit.com`, link affiliate mặc định, danh sách host affiliate, độ trễ popup (mặc định 1500ms), công tắc bật.
2. [ ] **API Keys**: tạo key riêng cho n8n, lưu vào credentials n8n (chỉ hiện một lần).
3. [ ] n8n gọi `http://localhost:3000/api/v1/posts` với `Authorization: Bearer hq_...`; mặc định `status=draft`, đặt `published` khi muốn đăng ngay.

## 6. Kiểm tra sau deploy (30 phút đầu)

- [ ] `pm2 list`: cả web và n8n `online`; `free -h`: swap dùng thấp.
- [ ] `sudo dmesg -T | grep -i -E "killed process|out of memory"`: không có tiến trình bị OOM-kill.
- [ ] Mở link tin ẩn đầy đủ: thấy bài, không menu/giỏ hàng; `curl -sI https://tin.haianhfruit.com/` trả 404 + `X-Robots-Tag: noindex`; mở cùng đường dẫn trên domain chính trả 404.
- [ ] Thống kê tin ẩn có số liệu (chờ tối đa 30 giây sau khi có lượt xem).
- [ ] Log PM2 không có lỗi lặp.

## 6b. Rollback

- **Giao diện:** `UI_THEME=classic` + `npm run pm2:reload` (không cần deploy lại).
- **Tin ẩn/API:** Tin tức ẩn → Cài đặt → tắt "Bật khu tin ẩn và API" (link 404, API 503 trong tối đa 30 giây).
- **Mã:** `git checkout` về bản trước + `npm run pm2:reload`; các cột/bảng mới của migration không ảnh hưởng mã cũ. Gỡ migration: xem `11_plan_slices/S42.md`.
- **Dữ liệu:** khôi phục từ bản sao lưu ở bước staging/production.

## 7. Điều chưa được kiểm chứng (cần lưu ý)

- Chưa chạy với PostgreSQL, Cloudinary, Nginx, DNS, SSL thật; toàn bộ lệnh vận hành trong `docs/14` chưa chạy thử trên Ubuntu.
- Chưa chạy luồng đặt hàng thật (form thanh toán giống hệt bản cũ nhưng chưa gửi thử).
- Chưa thử Safari iOS và trình duyệt trong app mạng xã hội; popup affiliate cần thử ở đó.
- `scripts/backup-db.js` chưa chạy `pg_dump`/rclone thật (máy thử không có).
- Biến cấu hình n8n (`N8N_CONCURRENCY_PRODUCTION_LIMIT`...) cần đối chiếu với phiên bản n8n đang cài.
- Ngưỡng RAM PM2 (192MB heap, restart 280MB) là ước lượng, chưa đo trên VPS.

## 8. Vấn đề còn tồn (đã ghi trong `.ai/runs/persist/00_recommendations_log.md`)

- **MUST:** `/sitemap.xml` gọi `prisma.blog` (model không tồn tại, đúng là `blogPost`) nên có thể lỗi 500; chưa sửa vì ngoài phạm vi.
- Banner admin: nên có hướng dẫn kích thước/ảnh riêng cho khung vòm của v2.
- Khối combo và đánh giá ở trang chủ vẫn là nội dung cố định trong view.
- Thống kê tin ẩn chưa loại trùng người xem (mỗi lần tải lại tính một lượt).
- Thêm mã phiên bản (`?v=`) cho CSS/JS để tăng cache Nginx.

## 9. Cập nhật 2026-11-13: lỗi sitemap đã sửa
- `/sitemap.xml` (trước đây lỗi 500 vì gọi `prisma.blog`) đã sửa: chỉ gồm trang tĩnh còn tồn tại, sản phẩm đã xuất bản, danh mục đang bật (`/products?category=<slug>`), blog đã đăng (`/blog/<slug>`); KHÔNG gồm tin tức ẩn hay bản nháp; dùng `SITE_URL` làm tên miền khi có. Test: `tests/s56-sitemap.test.js`. Mục "Vấn đề còn tồn" ở trên không còn mục sitemap.
- Máy dev: PostgreSQL cài dạng zip ở `C:\Users\<bạn>\pgsql17` (dữ liệu `pgdata17`) KHÔNG tự chạy sau khi khởi động máy; bật lại bằng `pg_ctl` như đã hướng dẫn.
