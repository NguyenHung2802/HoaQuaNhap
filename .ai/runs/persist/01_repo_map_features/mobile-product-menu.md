# REPO MAP — Menu danh mục sản phẩm mobile
- Cập nhật: 2026-08-09 15:57

## File liên quan
- `src/views/partials/navbar.ejs`: markup menu, link danh mục và JavaScript toggle mobile.
- `public/css/style.css`: hiển thị submenu desktop/mobile và kiểm soát pointer event.

## Luồng
1. Chạm “Sản phẩm” để mở menu trên mobile.
2. Chạm danh mục cha để mở submenu.
3. Chạm danh mục con để điều hướng tới `/products?category=<slug>`.

## Rủi ro
- Rule chung đặt `pointer-events: none`; breakpoint mobile phải bật lại pointer event khi submenu được dùng.
