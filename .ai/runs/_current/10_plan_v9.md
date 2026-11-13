# Plan v9 — Nâng cấp giao diện, API đăng bài cho n8n, Tin tức ẩn kèm popup affiliate
- Ngày: 2026-11-12
- Tham chiếu: `10_plan.md` đến `10_plan_v8.md` (v8 là "Sản phẩm nhiều danh mục", đã xong)
- BA nguồn: `00_ba_v9_addendum.md`
- Slice mới đánh số tiếp từ S42 (đã có S1–S41).

## 1. Goal
Cho n8n đăng bài qua API, thêm khu tin tức ẩn trên subdomain có popup affiliate và thống kê, làm mới giao diện công khai, và giữ hệ thống ổn định trên VPS 1GB RAM.

## 2. Scope
- In: theo BA v9 mục 6.
- Out: đổi stack, sửa giao diện admin cũ, lưu media trên VPS, redirect/click cưỡng ép.

## 3. Constraints & Assumptions
- Node 18+, Express, EJS, Prisma 5, PostgreSQL, Cloudinary; VPS 1 vCPU/1GB RAM/20GB SSD, n8n chạy chung.
- Chưa có thư viện: cần thêm `sanitize-html` (làm sạch HTML); rate limit viết nhẹ trong bộ nhớ (không thêm thư viện).
- Verification chạy local (không có Docker compose trong repo): `npx prisma validate`, `node --check`, biên dịch EJS, `curl`, `tin.localhost:3000`.
- Giả định: như BA mục 18.

## 4. Approach (đã chốt)
Một bảng `BlogPost` dùng chung (`post_type`), định tuyến theo host, n8n gọi `http://localhost:3000/api/v1/posts`, media stream thẳng Cloudinary.

## 5. Slice Plan
```
SLICE  GOAL                               DELIVERABLES                          DoD (testable)                               VERIFY                                   CHECKPOINT
-----  ---------------------------------  ------------------------------------  -------------------------------------------  ---------------------------------------  ----------
S42    Nền dữ liệu bài viết/API key/stat  Schema + migration + Setting keys     prisma validate OK; migrate chạy; dữ liệu cũ  npx prisma validate; migrate dev         Sau PASS
                                                                                 không đổi; home/blog/admin chỉ lấy blog
S43    Pipeline nội dung và media         content.service (sanitize, slug, link  Upload ảnh/video stream OK; HTML độc bị     node --check; script thử sanitize/slug;  Sau PASS
                                          affiliate allowlist), media.service    loại; slug không dấu đúng; link lạ bị chặn   thử upload ảnh nhỏ
S44    API key + API đăng bài             apiKey service/middleware, admin trang POST tạo bài nháp có ảnh; trùng external_id   curl 401/201/200/400/413/429             Sau PASS
                                          quản lý key, POST /api/v1/posts, rate  trả bài cũ; key thu hồi bị 401
                                          limit, PUT/DELETE
S45    Admin tin tức ẩn                   /admin/news list/create/edit/preview, Tạo/sửa tin ẩn; copy link đầy đủ; xem      Duyệt tay trên admin; EJS compile        Sau PASS
                                          copy link, Settings affiliate mặc định trước nháp; cài link mặc định + allowlist
S46    Host routing + trang tin ẩn        Host middleware, layout news, route   URL đúng → bài; sai token/slug/ngày/nháp →  curl với Host header, tin.localhost:3000  Sau PASS
                                          /tin-tuc/:date/:slug/:token, robots,  404; host chính 404; không session/menu
                                          noindex, 404 trung tính, rate limit
S47    Popup affiliate + thống kê         Popup JS/CSS, banner dính, CTA cuối   Thân popup mở tab mới + đóng; X/nền chỉ đóng; Trình duyệt thử tay; query bảng thống kê Sau PASS
                                          bài, /t beacon, buffer ghi lô, bảng   số liệu ghi vào NewsStatDaily; admin thấy
                                          thống kê admin
S48    Trang bài viết chuyên nghiệp       OG/SEO meta, mục lục, thời gian đọc,  Dán link vào công cụ xem trước hiển thị đúng; Duyệt tay; EJS compile                  Sau PASS
                                          chia sẻ, bài/sản phẩm liên quan,       trang blog hiển thị video/gallery
                                          video và gallery
S49    Vận hành VPS 1GB                   Doc + cấu hình: swap, PM2 theo tên app, Script PM2 không đụng n8n; cache danh mục  node --check; đọc tài liệu; kiểm tra RAM  Sau PASS
                                          max_memory_restart, Nginx subdomain,  hoạt động; hướng dẫn Nginx/SSL/logrotate
                                          logrotate, cache menu, doc ENV
S50    3 bản mẫu giao diện                3 file HTML mẫu chạy được (A/B/C)     Chủ web xem và chọn 1 bản                    Mở bằng trình duyệt                      Chờ chủ chọn
S51    Design system + layout chung       Tokens CSS, header/footer, drawer giỏ Layout mới chạy cho mọi trang công khai;     Duyệt tay desktop/mobile                 Sau PASS
                                          hàng, animation nền tảng              có cờ quay về layout cũ
S52    Trang chủ mới                      Hero, bento, sản phẩm nổi bật, tin    Dữ liệu thật hiển thị; animation mượt         Duyệt tay; Lighthouse mobile             Sau PASS
S53    Shop + chi tiết sản phẩm mới       Lưới, lọc, quick-view, chi tiết       Giữ logic lọc/danh mục/khuyến mãi hiện có     Duyệt tay; chạy lại lọc danh mục         Sau PASS
S54    Giỏ hàng + checkout mới            Hiệu ứng thêm giỏ, drawer, checkout   Đặt hàng COD, voucher, điểm thưởng vẫn đúng  Đặt thử đơn trên dev                     Sau PASS
```
Thứ tự thực thi: S42 → S43 → S44 → S45 → S46 → S47 → S48 → S49; S50 chạy song song từ đầu (không phụ thuộc code); S51–S54 chỉ bắt đầu sau khi chủ chọn bản mẫu.

## 5b. Quyết định giao diện (2026-11-12) — thay thế mục S50–S54 ở bảng trên khi thi công
- Chốt bản C, nền trắng, giữ nhận diện và bố cục khối của web cũ; tham chiếu `docs/mockups/mau-c2-nen-trang.html`.
- Công nghệ chuyển động (nhẹ cho VPS 1GB và điện thoại, không thêm thư viện nặng): CSS + IntersectionObserver + View Transitions API (chuyển trang và ảnh sản phẩm "bay" vào cửa sổ xem nhanh, có fallback), FLIP khi lọc, ảnh bay vào giỏ, drawer giỏ hàng, toast thay alert, header thu gọn + thanh tiến trình cuộn, số chạy, đếm ngược flash sale, nút hút chuột (chỉ thiết bị có chuột), `prefers-reduced-motion`.
- Giữ Bootstrap 5 cho lưới/form; thay AOS bằng reveal tự viết khi đến S51 (giảm tải). Swiper giữ cho slider banner do admin quản lý.
- Nguyên tắc triển khai: làm từng trang, so sánh với bản cũ, có cờ quay về layout cũ; không đổi route, controller hay dữ liệu.
- Phần đã duyệt qua mẫu: trang chủ, thẻ sản phẩm, xem nhanh, giỏ. Trang chi tiết sản phẩm, shop, giỏ/checkout sẽ có mẫu ngắn trước khi code ở S53/S54.

## 6. Detailed Checklist
- S42
  - [ ] Thêm cột vào `BlogPost`, model `ApiKey`, `NewsStatDaily` trong `prisma/schema.prisma`.
  - [ ] Tạo migration; kiểm tra bài cũ có `post_type='blog'`.
  - [ ] Thêm `where post_type='blog'` vào `home.controller.js`, `public/blogs/blogs.controller.js`, `blogs/blogs.controller.js`.
  - [ ] Thêm Setting keys mặc định trong seed (không ghi đè giá trị có sẵn).
- S43
  - [ ] `src/modules/posts/posts.service.js`: tạo/sửa bài dùng chung cho admin và API.
  - [ ] `src/utils/slug.js` kiểm tra bỏ dấu, `đ` → `d`; hậu tố khi trùng.
  - [ ] Cài `sanitize-html`; cấu hình allowlist + iframe whitelist.
  - [ ] Cập nhật `upload.middleware.js`: `upload_stream`, hỗ trợ video (≤ 20MB), giới hạn đồng thời 2.
  - [ ] Hàm kiểm tra `affiliate_url` (https + allowlist host).
- S44
  - [ ] `src/modules/api-keys/` (service sinh/hash/thu hồi, admin UI tạo và thu hồi).
  - [ ] Middleware `apiKeyAuth`; rate limit trong bộ nhớ.
  - [ ] `POST /api/v1/posts` JSON + multipart; idempotency; trả `url`.
  - [ ] `PUT`/`DELETE`; tài liệu `docs/12-api-posts.md` kèm ví dụ n8n HTTP Request.
- S45
  - [ ] `src/modules/news/` (admin route/controller) và view `admin/news/*`.
  - [ ] Sidebar admin thêm mục "Tin tức ẩn" và "API Keys".
  - [ ] Settings: link mặc định, allowlist host, độ trễ popup, `news.host`, `news.enabled`.
- S46
  - [ ] Middleware host đặt trước session trong `src/app.js`.
  - [ ] Router tin ẩn, layout `layouts/news`, trang bài, 404 trung tính, robots riêng.
  - [ ] Header `X-Robots-Tag`, meta noindex; rate limit số lần 404.
- S47
  - [ ] `public/js/news-popup.js` + CSS; quy tắc bấm; focus trap; reduced-motion.
  - [ ] Banner dính và CTA cuối bài.
  - [ ] Endpoint `/t`, buffer thống kê, flush theo timer và khi tắt tiến trình.
  - [ ] Bảng thống kê trong admin.
- S48 / S49 / S50: theo bảng; chi tiết trong file slice khi tới lượt.

## 7. Data & Migration Plan
- Chạy: `npx prisma migrate dev --name news_api_foundation` (dev), `npx prisma migrate deploy` (production).
- Rollback: migration down thủ công (xóa 2 bảng, xóa cột mới); bài cũ không bị thay đổi.
- Production: sao lưu DB trước khi migrate.

## 8. Verification Plan
- Tự động/nhẹ: `npx prisma validate`, `node --check` các file mới, biên dịch EJS, script thử sanitize/slug/token.
- Thủ công theo slice: bảng DoD mục 5. Không có test framework trong repo nên không thêm mới; kiểm thử bằng `curl` và duyệt tay.

## 9. Risks & Mitigations
- Hết RAM: S49 làm sớm trên server; giữ upload đồng thời ≤ 2.
- Lọt tin ẩn ra blog/trang chủ: S42 lọc `post_type`, S46 kiểm tra sitemap/blog.
- Hủy tài khoản affiliate do vi phạm: popup theo quy tắc minh bạch.
- Giao diện mới làm hỏng luồng mua: S51 có cờ quay về layout cũ; S54 test đặt hàng.

## 10. Execution Guidance
- Làm từng slice, PASS verify rồi mới sang slice tiếp; không dán log dài vào chat, ghi vào `20_implement.md` (append).

## 11. Next Action
- Chờ chủ web xác nhận master plan này; sau khi chốt sẽ tạo file `11_plan_slices/S42.md` … cho từng slice. S50 (3 bản mẫu) bắt đầu ngay vì không đụng code hệ thống.

## 12. Deep Thinking Results
- *Approach yếu ở đâu?* Chung bảng khiến mọi truy vấn cũ phải lọc `post_type` — đã đưa vào S42.
- *Có đơn giản hơn?* Không thêm Redis/queue/thư viện nặng; rate limit và thống kê chạy trong bộ nhớ.
- *Chỉ làm S42–S47 thì sao?* Đã đủ cho API + tin ẩn + popup; các slice 48–54 độc lập.
- Dependency: S43 → S44/S45 → S46 → S47; S49 độc lập; S51–S54 phụ thuộc S50.
- Nhất quán BA: mọi Must (FR-01…16) đã có slice; Out-of-scope không lọt vào.
- Đề xuất bổ sung (không bắt buộc): trang "Thử API" trong admin; kill switch `news.enabled`.
