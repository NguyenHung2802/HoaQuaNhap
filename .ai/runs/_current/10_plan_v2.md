# Plan v2 — HỆ THỐNG AUTH HỢP NHẤT & PHASE 2 UPDATE
- Ngày: 2026-04-01 16:07
- Tham chiếu: [10_plan.md](file:///d:/Documents/Web/WebHoaQua/.ai/runs/_current/10_plan.md)
- Lý do bổ sung: Người dùng yêu cầu Unified Auth & Chính thức hóa Customer Auth vào Phase 2.
- BA nguồn: [00_ba_v2_addendum.md](file:///d:/Documents/Web/WebHoaQua/.ai/runs/_current/00_ba_v2_addendum.md)

## Bổ sung / Thay đổi so với plan trước
- **Gộp Controller**: Chuyển toàn bộ logic auth từ `src/modules/admin/auth` và `src/modules/auth` (được tạo trước đó) thành một module `auth` duy nhất tại `src/modules/auth`.
- **Logic Redirect**: Cập nhật logic `auth.controller.js` để tự động chuyển hướng dựa trên role.
- **Update Documentation**: Cập nhật Phase 2 và Roadmap tổng quát.

## Slice mới (nếu có)
```
SLICE  GOAL (1-2 dòng)                  DELIVERABLES                     DoD (testable)                 VERIFY (lệnh)                     CHECKPOINT
---    ---                              ---                              ---                            ---                               ---
S5     Unified Auth Refactor            Refactored Auth Module           Admin -> /admin, User -> /     Login with diff roles             Sau khi test OK
S6     Documentation Update             Updated Phase 2 & Roadmap files  Files reflect new scope        Manual check docs                 Sau khi update OK
```

## Detailed Implementation Checklist
- **Slice S5 (Refactor Auth)**
    - [ ] Di chuyển/Gộp code vào `src/modules/auth/auth.controller.js`.
    - [ ] Chỉnh sửa `src/routes/admin.route.js`: Redirect `/admin/login` sang `/auth/login` (hoặc xóa/gộp).
    - [ ] Thêm login modal popup cho UI (giảm ma sát).
    - [ ] Update `src/views/auth/login.ejs` (di chuyển từ `public/auth`).
- **Slice S6 (Documentation)**
    - [ ] Cập nhật `docs/phases/02-auth-admin.md` để bao gồm Customer Auth.
    - [ ] Cập nhật `docs/04-roadmap-checklist.md`.
    - [ ] Cập nhật `README.md` (nếu cần).

## Verification Plan
1. Lấy 1 tài khoản `admin` -> Login tại `/auth/login` -> Phải về `/admin`.
2. Lấy 1 tài khoản `customer` -> Login tại `/auth/login` -> Phải về `/`.
3. Logout -> Login lại bằng popup/popup modal (nếu làm).

## ⚠️ CHECKPOINT: Logs Update
- [x] Đã kiểm tra `00_requirements_log.md`.
- [x] Đã kiểm tra `00_recommendations_log.md`.
