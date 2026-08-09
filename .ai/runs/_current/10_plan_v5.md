# Plan v5 — Nâng UI danh mục con và thông tin dinh dưỡng
- Ngày: 2026-07-29 10:05
- Tham chiếu: `10_plan.md`, các version trước
- Lý do bổ sung: BA addendum v5
- BA nguồn: `00_ba_v5_addendum.md`

## Bổ sung / Thay đổi so với plan trước
Không đổi các slice cũ. Thêm hai slice độc lập:

```text
SLICE  GOAL                         DELIVERABLES                         DoD
-----  ---------------------------  -----------------------------------  ------------------------------------
S40    Làm rõ phân cấp bộ lọc       Count nhóm, badge con, chevron, ARIA  Click/hover/active đều mở đúng
S41    Rich text cho dinh dưỡng     Quill create/edit, public renderer    HTML và plain text cũ hiển thị đúng
```

## Verification
- `node --check src/modules/public/products/products.controller.js`
- Render-compile toàn bộ EJS bằng `ejs.compile`.
- `git diff --check`
- Smoke UI trên `/products`, create/edit admin và trang chi tiết.

## Rủi ro & giảm thiểu
- Nút trong form có `type="button"` để không submit.
- Giữ fallback plain text để không phá dữ liệu cũ.
- Không đổi schema nên rollback an toàn.

## Deep Thinking
Approach nhỏ nhất là tái dùng Quill và dữ liệu Text hiện có; không over-engineer thành schema dinh dưỡng. S40/S41 không phụ thuộc nhau và đều ship độc lập. Đề xuất ngoài scope: sanitization HTML tập trung.
