# Review — Homepage Analysis & Menu Fix
- **Ngày**: 2026-05-08
- **BA ref**: `17_ba_homepage_analysis.md`
- **Plan ref**: `17_master_plan.md`

---

## Kết quả Test

| Task | Mô tả | Kết quả | Ghi chú |
|------|--------|---------|---------|
| M1 | Fix hover dropdown | ✅ PASS | Desktop: hover hiện dropdown, click → navigate `/products`. Mobile: click toggle. |
| M2 | Fix categories orderBy | ✅ PASS | Categories hiển thị theo `sort_order ASC`. |
| S1 | Cải thiện Combo links | ✅ PASS | Combo Buổi Sáng → `dau-tay`, Nho → `nho-nhap-khau`, Táo → `tao-nhap-khau`, Giỏ Quà → `/products`. |

## Files thay đổi

| File | Thay đổi |
|------|----------|
| `src/modules/public/home/home.controller.js` | Thêm `orderBy: { sort_order: 'asc' }` cho categories query |
| `src/views/partials/navbar.ejs` | Xóa `data-bs-toggle="dropdown"`, thêm CSS hover + JS mobile toggle |
| `src/views/public/home/index.ejs` | Cập nhật combo cards: labels, icons, links filter category thực |

## Review Checklist

- [x] Không có lỗi Must-fix
- [x] Không có lỗi Should-fix
- [x] Code không lặp lại (DRY OK)
- [x] Mobile behavior bảo toàn (JS toggle for < 992px)
- [x] Navigation links hoạt động đúng
- [x] Category filter hoạt động đúng
- [x] Đã cập nhật recommendations log với 3 đề xuất tương lai

## Kết luận
**PASS** — Tất cả 3 task hoàn thành, test xác nhận OK.
