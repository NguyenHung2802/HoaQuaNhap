# Master Plan — Homepage Analysis & Menu Fix
- **BA ref**: `17_ba_homepage_analysis.md`
- **Ngày**: 2026-05-08

---

## Scope chốt: M1 + M2 + S1

### Slice duy nhất (UI-only, không thay đổi DB/API):

| # | Task | File(s) | Thay đổi |
|---|------|---------|----------|
| M1 | Fix hover dropdown | `navbar.ejs` + CSS | Xóa `data-bs-toggle="dropdown"`, thêm CSS hover cho desktop. Mobile vẫn click. |
| M2 | Fix categories orderBy | `home.controller.js` | Thêm `orderBy: { sort_order: 'asc' }`. |
| S1 | Cải thiện Combo links | `index.ejs` (home) | Cập nhật link cho 4 combo cards. |

### Đề xuất tương lai (ghi vào recommendations log):
- C1: Thêm model Combo/Bundle/Gift Set vào schema
- C2: Admin CRUD cho combo collections
- C3: Tags/Labels cho sản phẩm
