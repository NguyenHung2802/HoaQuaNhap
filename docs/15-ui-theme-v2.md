# Giao diện v2 (Phase 13, S51–S54)

Giao diện mới nền trắng, giữ nhận diện xanh đậm `#1b4d3e` + vàng `#f4b400`, chữ Playfair Display + Outfit, bản mẫu tham chiếu `docs/mockups/mau-c2-nen-trang.html`.

## Nguyên tắc
- **Không viết lại cấu trúc HTML/logic cũ.** S51 là một lớp phủ (CSS + JS) trên Bootstrap và `style.css` hiện có, nên các tính năng đã có (menu hover/đa cấp, tìm kiếm, giỏ hàng, flash sale, popup liên hệ...) giữ nguyên.
- **Có công tắc quay về giao diện cũ:** đặt `UI_THEME=classic` trong `.env` rồi `npm run pm2:reload`. Mặc định là `v2`. Khi `classic`, layout không nạp bất kỳ file v2 nào (có test kiểm tra).
- Mọi quy tắc CSS nằm dưới `body.theme-v2` hoặc tiền tố `tv2-`, không ảnh hưởng admin hay khu tin ẩn.
- Nếu `theme-v2.js` lỗi, trang vẫn dùng bình thường (chỉ mất hiệu ứng); biểu tượng giỏ vẫn dẫn tới `/cart`.
- Tôn trọng `prefers-reduced-motion` (tắt mọi chuyển động).

## Thành phần của S51
| Thành phần | File |
| --- | --- |
| Công tắc theme (`res.locals.uiTheme`) | `src/app.js`, `src/views/layouts/main.ejs` |
| CSS v2 (header kính mờ + thu gọn, nút, thẻ sản phẩm/bài viết, footer xanh đậm, thanh điều hướng dưới, toast, ngăn kéo giỏ hàng, chuyển trang) | `public/css/theme-v2.css` |
| JS v2 (thanh tiến độ, header thu gọn, hiện dần khi cuộn, ngăn kéo giỏ, ảnh bay vào giỏ, tải trước trang khi rê chuột) | `public/js/theme-v2.js` |
| Ngăn kéo giỏ hàng (HTML) | `src/views/partials/mini-cart.ejs` |
| API dữ liệu ngăn kéo | `GET /cart/mini` (`cart.controller.js`) |

## Hành vi
- **Chuyển trang mượt:** View Transitions API cho trang thật (Chrome/Edge/Safari mới); trình duyệt cũ tự bỏ qua.
- **Ngăn kéo giỏ hàng:** bấm biểu tượng giỏ ở header hoặc thanh dưới (điện thoại) thì mở ngăn kéo, tăng/giảm/xóa không tải lại trang, hiển thị tiến độ miễn phí giao hàng, chặn nút thanh toán khi có sản phẩm hết hàng. Ở `/cart` và `/checkout` biểu tượng vẫn dẫn tới trang đầy đủ; bấm kèm Ctrl/Cmd/chuột giữa vẫn mở tab mới như thường.
- **Thêm vào giỏ:** ảnh sản phẩm bay vào biểu tượng giỏ, huy hiệu nảy số (hàm `addToCart` cũ được bọc lại, không đổi logic).
- **Hiện dần khi cuộn:** chỉ áp cho phần tử nằm dưới màn hình lúc tải và chưa dùng AOS.
- **Tải trước:** rê chuột lên liên kết nội bộ (không phải giỏ/thanh toán/tài khoản/admin) thì tải trước tối đa 6 trang, chỉ trên máy có chuột.

## Đã làm tiếp
- **S52 trang chủ** (`home-v2.css`): hero editorial dùng banner admin; các khối còn lại tinh chỉnh.
- **S53 shop + chi tiết** (`shop-v2.css`, `shop-v2.js`, `product-v2.js`): lọc/sắp xếp/phân trang không tải lại trang (có dự phòng tải đầy đủ), thêm nhanh vào giỏ, bộ lọc gập trên điện thoại, thanh mua dính.

- **S54 giỏ hàng + thanh toán** (`cart-v2.css`, `cart-v2.js`, `order-steps.ejs`): thanh tiến trình 3 bước, giỏ hàng đổi số lượng/xóa không tải lại trang, trang thanh toán chỉ đổi trình bày (form và script giống hệt bản cũ).

## Trước khi bật v2 ở production
1. Chạy thử ĐẶT HÀNG thật trên staging (COD và chuyển khoản, có voucher, điểm thưởng, freeship) và xem trang thành công.
2. Thử trên điện thoại thật (Safari iOS, Chrome Android) và trình duyệt trong app Facebook/Zalo/TikTok.
3. Kiểm tra banner admin trong khung vòm ở trang chủ.
4. Nếu có vấn đề: `UI_THEME=classic` + `npm run pm2:reload` quay về giao diện cũ ngay.

## Hiệu năng tải trang (S55, 2026-11-12)
Chủ web phản ánh trang vào chậm và hiệu ứng chỉ chạy sau khoảng 1 giây. Đo thực tế trên máy chủ dev:
- HTML trả về ~30ms (không phải lỗi server).
- Trang chờ **5 tên miền CDN** (jsdelivr, unpkg, cdnjs, Google Fonts), mỗi tên miền tốn 0,5–1,3 giây DNS+TLS; CSS chặn vẽ xong ở ~2,3 giây, `DOMContentLoaded` ở ~3,5 giây.
- Chữ hero chỉ hiện sau khi Swiper khởi tạo và mọi khối `data-aos` ẩn cho đến khi AOS khởi tạo; cả hai đều phải chờ script CDN.
- Chuyển trang (View Transitions) làm trang cũ mờ dần ~0,2s + trang mới ~0,34s.

Đã sửa (chỉ ở giao diện v2; `UI_THEME=classic` giữ nguyên bản cũ dùng CDN và AOS):
1. **Tự phục vụ thư viện**: Bootstrap, Font Awesome (+ webfont woff2), Swiper, SweetAlert2 và phông Outfit/Playfair (đủ latin, latin-ext, vietnamese) nằm ở `public/vendor/`, cache 30 ngày bất biến (`/vendor` trong `src/app.js`), có preload phông. Không còn tên miền ngoài trong `<head>`/script của layout.
2. **Bỏ AOS** ở v2, thay bằng bộ hiện dần trong `theme-v2.js`: chỉ áp cho phần tử nằm dưới màn hình lúc tải (phần nhìn thấy ngay thì hiển thị tức thì), thời gian 0,45s.
3. **Hero hiện bằng CSS thuần**: slide đầu animate ngay khi trang vẽ xong (0,5s), không chờ Swiper; chống giật bố cục trước khi Swiper khởi tạo; ảnh slide sau tải nền ưu tiên thấp (không lazy để không bị khung trống khi tự chuyển).
4. **Chuyển trang**: bỏ hiệu ứng làm mờ trang cũ, trang mới hiện trong 0,16s.
5. Logo thanh toán ở footer (tên miền ngoài) tải lười.

Kết quả đo lại (trên cùng máy): `DOMContentLoaded` 3510ms → ~415ms; CSS chặn vẽ xong 2314ms → ~225ms; không còn yêu cầu CDN. Kiểm thử: `tests/s55-performance.test.js`.

Còn có thể chậm khi: (a) chưa có banner admin nên hero dùng ảnh mặc định từ Unsplash (tải từ ngoài): hãy đăng banner qua admin (Cloudinary); (b) ảnh sản phẩm Cloudinary chưa tối ưu: nên dùng `f_auto,q_auto` (đã có hàm `optimizeImageUrl` ở `media.service`, chưa áp cho ảnh sản phẩm/banner).
Ghi chú: các tệp `public/vendor/fontawesome/webfonts/*.ttf` không dùng tới (trình duyệt dùng woff2), có thể xóa tay.
