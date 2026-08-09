# BA Addendum v6 — Sửa menu danh mục sản phẩm trên mobile
- Ngày: 2026-08-09 15:57
- Tham chiếu: `00_ba.md` và các addendum trước
- Lý do bổ sung: Người dùng báo link danh mục con trong menu mobile không điều hướng/lọc.

## Bổ sung / Thay đổi
- Phạm vi: menu điều hướng “Sản phẩm” trên màn hình dưới 992px.
- Hiện trạng: submenu được hiển thị nhưng kế thừa `pointer-events: none`, nên link con không nhận thao tác chạm.
- Must: link danh mục con phải điều hướng đến `/products?category=<slug>`; desktop giữ nguyên hành vi hover.
- Ngoài phạm vi: bộ lọc trong trang shop, API, controller và cơ sở dữ liệu.
- Tiêu chí nghiệm thu: mở menu và submenu trên mobile, chạm danh mục con sẽ điều hướng; submenu đóng vẫn không tương tác; desktop không đổi.

## Tác động đến Plan/Slice hiện có
- Một slice UI/CSS độc lập; không ảnh hưởng API/DB.

