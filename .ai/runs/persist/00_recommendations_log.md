# NHẬT KÝ ĐỀ XUẤT
- Ngày tạo: 2026-04-02
- Định dạng: bảng fixed-width trong code block (không dùng bảng markdown)

```
TYPE        STATUS   NGÀY        BỐI CẢNH                  MÔ TẢ
----------  -------  ----------  ------------------------  ----------------------------------------
SHOULD      TODO     2026-04-02  Phase 3 - Products        Thêm thuộc tính original_url cho ảnh SP để lưu ảnh gốc.
COULD       DONE     2026-04-03  Phase 8 - Optimization    Thêm chức năng "Duplicate Product" để admin tạo nhanh (S39).
MAYBE       TODO     2026-04-02  Phase 3 - Categories      Hỗ trợ Đa ngôn ngữ (I18n) cho tên sản phẩm/danh mục.
SHOULD      TODO     2026-05-08  Homepage - Combo          Tạo model Combo/Bundle/Gift Set (Giỏ quả, Set, Túi) trong DB.
SHOULD      TODO     2026-05-08  Homepage - Combo          Admin CRUD cho Combo collections, liên kết sản phẩm thực.
COULD       TODO     2026-05-08  Homepage - Products       Thêm Tags/Labels cho SP để filter linh hoạt (buoi-sang, qua-bieu).
SHOULD      TODO     2026-07-29  Product Rich Text         Sanitization HTML tập trung cho description và nutritional_info.
MUST        DONE     2026-08-10  Product Categories        Quan hệ nhiều-nhiều, backfill dữ liệu cũ và giữ category_id làm danh mục chính.
```

```
TYPE        STATUS   NGÀY        BỐI CẢNH                  MÔ TẢ
----------  -------  ----------  ------------------------  ----------------------------------------
SHOULD      TODO     2026-11-12  BA v9 - Vận hành          Rotate N8N_ENCRYPTION_KEY nếu khóa trong docs/10-self-host-n8n.md là khóa thật; bỏ giá trị cứng khỏi tài liệu.
SHOULD      TODO     2026-11-12  BA v9 - PM2               Đổi script pm2:* để chỉ nhắm WebHoaQua-Prod, không ảnh hưởng n8n (S49).
COULD       TODO     2026-11-12  BA v9 - API                Trang "Thử API" trong admin, nhận markdown, lên lịch đăng, A/B popup.
COULD       TODO     2026-11-12  BA v9 - Hạ tầng            Cân nhắc tên miền riêng cho khu tin ẩn để cách ly uy tín tên miền chính.
SHOULD      TODO     2026-11-12  BA v9 - Upload             Chuyển uploadToCloudinary sang upload_stream, bỏ base64 để giảm RAM (S43).
```

```
TYPE        STATUS   NGÀY        BỐI CẢNH                  MÔ TẢ
----------  -------  ----------  ------------------------  ----------------------------------------
MUST        TODO     2026-11-12  S46 - SEO sitemap          pages.controller.renderSitemap gọi prisma.blog (model không tồn tại, đúng tên là blogPost) nên /sitemap.xml có thể lỗi 500; sửa và chỉ đưa bài post_type='blog'.
COULD       TODO     2026-11-12  S46 - Hiệu năng            Cache nội dung bài tin ẩn trong bộ nhớ (theo id + updated_at) nếu lượt xem lớn, giảm truy vấn DB trên VPS 1 vCPU.
COULD       TODO     2026-11-12  S46 - Bảo mật              Cho phép lọc IP hoặc chỉ nhận API từ 127.0.0.1 ở Nginx khi chỉ n8n nội bộ gọi.
```

```
TYPE        STATUS   NGÀY        BỐI CẢNH                  MÔ TẢ
----------  -------  ----------  ------------------------  ----------------------------------------
COULD       TODO     2026-11-12  S47 - Thống kê            Loại trùng lượt vào theo người dùng (cookie ẩn danh hoặc băm IP+UA theo ngày) nếu cần số người xem duy nhất.
COULD       TODO     2026-11-12  S47 - Popup                Thử A/B nhiều creative popup; thử Safari iOS và trình duyệt trong app Facebook/Zalo/TikTok trước khi chạy chiến dịch lớn.
```

```
TYPE        STATUS   NGÀY        BỐI CẢNH                  MÔ TẢ
----------  -------  ----------  ------------------------  ----------------------------------------
MUST        DONE     2026-11-12  S49 - Bảo mật n8n          Gỡ N8N_ENCRYPTION_KEY ghi cứng khỏi docs/10; chủ web cần kiểm tra khóa cũ có đang dùng thật không và rotate nếu có.
MUST        DONE     2026-11-12  S49 - PM2                 Script pm2:* chỉ nhắm WebHoaQua-Prod/Dev, không còn dùng all.
SHOULD      DONE     2026-11-12  S49 - Prisma               Gộp PrismaClient thành một client dùng chung (đã làm).
SHOULD      TODO     2026-11-12  S49 - Backup               Worker/cron sao lưu DB đã có script (scripts/backup-db.js); cần cài cron + RCLONE_REMOTE trên VPS và thử khôi phục.
COULD       TODO     2026-11-12  S49 - Static               Thêm mã phiên bản (?v=hash) cho css/js để tăng cache Nginx lên 30 ngày mà không lo file cũ.
```

```
TYPE        STATUS   NGÀY        BỐI CẢNH                  MÔ TẢ
----------  -------  ----------  ------------------------  ----------------------------------------
SHOULD      TODO     2026-11-12  S52 - Banner admin        Ảnh banner được đặt trong khung vòm 4:5 ở giao diện v2: thêm hướng dẫn kích thước (khuyến nghị ~1000x1250) hoặc trường ảnh riêng cho v2 ở trang quản lý banner.
COULD       TODO     2026-11-12  S52 - Nội dung             Nối khối combo và đánh giá khách hàng ở trang chủ vào DB (hiện là nội dung cố định trong view).
```
