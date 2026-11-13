# API đăng bài (n8n) — `/api/v1/posts`

Dùng để đăng bài tự động vào **blog công khai** (`type=blog`) hoặc **tin tức ẩn** (`type=news`). Mặc định bài vào **nháp** để bạn duyệt.

## 1. Chuẩn bị
1. Vào **Admin → API Keys → Tạo key**. Key dạng `hq_...` chỉ hiện **một lần**, hãy lưu vào credentials của n8n.
2. Trong `.env` đặt `SITE_URL="https://haianhfruit.com"` (dùng để dựng link trả về cho blog).
3. Cài đặt `news.*` (bảng `Setting`, nạp bởi `npx prisma db seed`):
   - `news.enabled` — `false` để tắt toàn bộ API ngay lập tức.
   - `news.host` — subdomain tin ẩn (mặc định `tin.haianhfruit.com`).
   - `news.affiliate_hosts` — danh sách host affiliate được phép (để trống = Shopee/TikTok mặc định).
4. n8n chạy cùng VPS nên gọi qua `http://localhost:3000/api/v1/posts` (không qua Nginx/SSL).

## 2. Xác thực và giới hạn
- Header `Authorization: Bearer hq_...` (hoặc `X-API-Key: hq_...`).
- 60 yêu cầu/phút cho mỗi key. Sai key 10 lần trong 5 phút từ một IP bị chặn 5 phút.
- Nội dung JSON tối đa 2MB. Ảnh tối đa 8MB, video tối đa 20MB, tối đa 10 ảnh gallery. Tối đa 2 upload chạy đồng thời (hàng đợi 15 giây).

## 3. Tạo bài — `POST /api/v1/posts`
Gửi `application/json` hoặc `multipart/form-data`.

| Trường | Bắt buộc | Mô tả |
| --- | --- | --- |
| `title` | có | Tiêu đề (tối đa 200 ký tự, tự bỏ thẻ HTML). |
| `content` | có | HTML. Được làm sạch: bỏ script/style/sự kiện; chỉ giữ iframe YouTube, TikTok, Facebook, Vimeo. |
| `type` | không | `blog` (mặc định) hoặc `news`. |
| `status` | không | `draft` (mặc định) hoặc `published`. |
| `summary` | không | Tóm tắt; để trống sẽ lấy 160 ký tự đầu của nội dung. |
| `slug` | không | Mặc định sinh từ tiêu đề, không dấu: `tin-du-an-dat-vung-ven`. Trùng thì thêm `-2`. |
| `published_at` | không | ISO 8601; mặc định lúc gọi nếu `published`. |
| `affiliate_url` | không | https và host nằm trong danh sách cho phép. Bỏ trống sẽ dùng link mặc định ở Setting. |
| `ad_headline`, `ad_cta_text` | không | Chữ trên popup affiliate. |
| `ad_image_url` | không | URL ảnh popup (https công khai), được tải lên Cloudinary. |
| `cover` (file) hoặc `cover_url` | không | Ảnh bìa. |
| `images` (file, nhiều) và/hoặc `image_urls` | không | Gallery (mảng JSON hoặc mỗi dòng một URL). |
| `video` (file mp4/webm) hoặc `video_embed_url` | không | Ưu tiên link nhúng YouTube/TikTok/Facebook để tiết kiệm dung lượng. |
| `tags` | không | Mảng hoặc chuỗi cách nhau dấu phẩy (tối đa 15). |
| `seo_title`, `seo_description` | không | SEO. |
| `source`, `external_id` | không | **Chống trùng**: gọi lại cùng cặp này sẽ trả bài cũ (HTTP 200), không tạo mới và không upload lại. |

Phản hồi `201` (mới) hoặc `200` (đã tồn tại):
```json
{
  "id": 12,
  "type": "news",
  "status": "draft",
  "title": "Ưu đãi hôm nay",
  "slug": "uu-dai-hom-nay",
  "url": "https://tin.haianhfruit.com/tin-tuc/12-11-2026/uu-dai-hom-nay/Xk3p9QmT2vLw8aRf1nZc7d",
  "admin_url": "https://haianhfruit.com/admin/news",
  "thumbnail_url": "https://res.cloudinary.com/...",
  "video_url": null,
  "gallery": [],
  "affiliate_url": "https://s.shopee.vn/xxxx",
  "published_at": null,
  "created": true
}
```
Với `news`, `url` là link đầy đủ có token — dùng link này để n8n đăng lên mạng xã hội (bản `draft` chưa mở được cho tới khi `published`).

## 4. Các endpoint khác
- `GET /api/v1/posts/:id` — xem bài.
- `PUT /api/v1/posts/:id` — sửa một phần (JSON hoặc multipart). Không đổi được `slug`, `type`, token, ngày trong URL để link đã phát hành không hỏng. Gửi `affiliate_url: ""` để gỡ link.
- `DELETE /api/v1/posts/:id` — xóa bài (204). Muốn chỉ gỡ khỏi web, dùng `PUT {"status":"draft"}`.

## 5. Lỗi
Mọi lỗi có dạng `{ "error": { "code": "...", "message": "..." } }`.

| HTTP | code thường gặp |
| --- | --- |
| 400 | `missing_title`, `missing_content`, `invalid_type`, `invalid_status`, `affiliate_host_not_allowed`, `invalid_affiliate_url`, `unsupported_video_host`, `invalid_url`, `unexpected_file`, `too_many_images` |
| 401 | `invalid_api_key` |
| 403 | `insufficient_scope` |
| 404 | `not_found` |
| 413 | `file_too_large`, `payload_too_large` |
| 415 | `unsupported_media` |
| 429 | `rate_limited`, `too_many_failures` |
| 503 | `api_disabled`, `upload_busy` |

## 6. Ví dụ n8n (HTTP Request, gửi ảnh)
- Method `POST`, URL `http://localhost:3000/api/v1/posts`, Authentication: Header Auth (`Authorization` = `Bearer hq_...`).
- Body Content Type: `Form-Data`: `title`, `content`, `type`=`news`, `status`=`draft`, `external_id` = ID của workflow/bài nguồn, `cover` (Binary File).
- Lưu `url` từ phản hồi để bước sau đăng lên Facebook/Zalo.

## 7. Lưu ý vận hành
- DB cần đã áp migration `20261112100000_news_api_foundation` (S42) và đã `npm install` (có `sanitize-html`).
- API nhận request từ mọi nguồn có key hợp lệ. Nếu chỉ n8n cùng VPS gọi, có thể chặn bên ngoài ở Nginx đối với `/api/v1/` (cho phép `127.0.0.1`).
