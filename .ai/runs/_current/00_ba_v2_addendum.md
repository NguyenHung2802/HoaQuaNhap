# BA Addendum v2 — HỆ THỐNG AUTH HỢP NHẤT (UNIFIED AUTH)
- Ngày: 2026-04-01 16:07
- Tham chiếu: 00_ba.md
- Lý do bổ sung: Người dùng yêu cầu gộp/hợp nhất đăng nhập cho cả Admin và Customer và chính thức đưa Customer Auth vào Phase 2.

## Bổ sung / Thay đổi
### 1. Unified Login Logic (Hợp nhất Đăng nhập)
- **Endpoint**: Sử dụng duy nhất `/auth/login` (hoặc `/login`) cho tất cả các đối tượng.
- **Xử lý Redirect (Role-based)**:
    - Nếu tài khoản có `role: 'admin'`: Chuyển hướng về `/admin`.
    - Nếu tài khoản có `role: 'customer'`: Chuyển hướng về trang chủ `/` (hoặc trang trước đó).
- **Endpoint cũ**: Giữ `/admin/login` làm alias (tùy chọn) hoặc redirect sang `/auth/login`.

### 2. Customer Registration (Đăng ký tài khoản)
- Thêm chính thức tính năng Đăng ký tài khoản khách hàng (`/auth/register`) vào phạm vi Phase 2.
- Bao gồm: Form đăng ký, Validation (Email trùng, SĐT trùng), Tự động link tới Customer profile.

### 3. Cập nhật tài liệu Phase 2
- Bổ sung các đầu mục liên quan đến Customer Auth vào `docs/phases/02-auth-admin.md` và `docs/04-roadmap-checklist.md`.

## Tác động đến Plan/Slice hiện có
- Cần Refactor: Gộp 2 Controller Auth hiện tại thành 1 module `auth` duy nhất tại `src/modules/auth`.
- Cần Cấu hình lại Routes: Chuyển toàn bộ auth routes về một nơi.

## Deep Thinking (Refined)
- **Security Check**: Việc dùng chung trang login có rủi ro "lộ" endpoint admin không?
    - *Trả lời*: Không, vì endpoint `/admin` vẫn được bảo vệ bởi middleware `isAdmin`. Việc biết trang login là chung không gây hại nhiều hơn việc biết `/admin/login`.
- **UX Enhancement**: Một tài khoản (SĐT/Email) có thể chuyển đổi role trong tương lai?
    - *Trả lời*: Hệ thống DB cho phép thay đổi `role` trong bảng `User`, luồng Unified login sẽ tự động thích ứng.
