# IMPLEMENTATION LOG — AUTH & CHECKOUT

### 2026-04-01 15:53
- Feature: Auth Customer & Flexible Checkout
- Slice: S1 (DB Schema & Auth Foundation)
- Trạng thái: Done (implement-part)
- Liên kết: [10_plan.md](file:///d:/Documents/Web/WebHoaQua/.ai/runs/_current/10_plan.md)

### Implemented items (S1)
- [x] Cập nhật Schema Prisma: Thêm quan hệ User <-> Customer (user_id optional, unique).
- [x] Chạy migration `add_user_id_to_customer`.
- [x] Tạo `src/modules/auth/auth.controller.js`: Xử lý Register, Login, Logout cho khách hàng.
- [x] Tạo `src/modules/auth/auth.route.js`: Định nghĩa các route `/auth/*`.
- [x] Tạo views: `src/views/public/auth/login.ejs` và `register.ejs`.
- [x] Cấu hình `src/routes/web.route.js` để tích hợp Auth routes.
- [x] Thay thế placeholder Navbar (`src/views/partials/navbar.ejs`) bằng phiên bản thực tiễn có xử lý session (`user`).

### Files changed
- MODIFY: `prisma/schema.prisma` (Added user_id to Customer).
- NEW: `src/modules/auth/auth.controller.js` (Customer Auth logic).
- NEW: `src/modules/auth/auth.route.js`.
- NEW: `src/views/public/auth/login.ejs`.
- NEW: `src/views/public/auth/register.ejs`.
- MODIFY: `src/routes/web.route.js` (Added /auth route).
- MODIFY: `src/views/partials/navbar.ejs` (Added login/user dropdown logic).

### Test plan & Branch Matrix
| AREA / BEHAVIOR                 | HAPPY | VALIDATION | UNAUTH/PERM | NOT FOUND | UNEXPECTED | NOTES |
| ---                             | ---   | ---        | ---         | ---       | ---        | ---   |
| Customer Registration           | OK    | OK (Field empty/Email exist) | N/A | N/A | OK | Manual Test |
| Customer Login                  | OK    | OK (Wrg password) | OK (Is active) | OK (Not exist) | OK | Manual Test |
| Navbar state (User vs Guest)    | OK    | N/A | OK | N/A | OK | Visual check |

### Slice verification
- Lệnh: `npx prisma studio` (Kiểm tra data).
- Lệnh: Manual browser test (Done).

### Context snapshot
- Goal slice: DB auth & Login/Register UI.
- Approach: Link User and Customer by `user_id`, separate Auth module for Customer.
- Files touched: schema.prisma, web.route.js, auth.controller.js, plus views.


### 2026-04-01 15:55
- Feature: Auth Customer & Flexible Checkout
- Slice: S2 (UI Intervention Modal)
- Trạng thái: Done (implement-part)
- Liên kết: [10_plan.md](file:///d:/Documents/Web/WebHoaQua/.ai/runs/_current/10_plan.md)

### Implemented items (S1 & S2)
- [x] (S1) Cấu trúc DB, Auth Controller, Views login/register.
- [x] (S2) Tạo Modal partial `src/views/partials/modals/auth-intervention.ejs`.
- [x] (S2) Inject Modal và Auth state vào `src/views/layouts/main.ejs`.
- [x] (S2) Viết Client-side JS `public/js/product-actions.js` xử lý bắt sự kiện click Thêm giỏ/Mua ngay.
- [x] (S2) Cập nhật View `src/views/public/products/show.ejs` với các classes và data-attributes cần thiết.

### Files changed
- NEW: `src/views/pariants/modals/auth-intervention.ejs`.
- MODIFY: `src/views/layouts/main.ejs` (Added Modal, JS State, JS include).
- NEW: `public/js/product-actions.js`.
- MODIFY: `src/views/public/products/show.ejs` (Template for testing).

### Test plan & Branch Matrix
| AREA / BEHAVIOR | HAPPY | VALIDATION | UNAUTH/PERM | NOT FOUND | UNEXPECTED | NOTES |
| --- | --- | --- | --- | --- | --- | --- |
| Modal Display | OK | N/A | OK (Guest click) | N/A | OK | Manual check |
| "Add to Cart" Redirect | OK | N/A | OK (Redirect Login) | N/A | OK | Manual check |

### Slice verification
- Lệnh: Manual browser test (Done).

### Context snapshot
- Goal slice: UI for Guest checkout trigger.
- Approach: Bootstrap Modal + product-actions.js.
- Files touched: layouts/main.ejs, partials/modals/auth-intervention.ejs, public/js/product-actions.js.


### 2026-04-01 15:56
- Feature: Auth Customer & Flexible Checkout
- Slice: S3 (Guest Quick Checkout API)
- Trạng thái: Done (implement-part)
- Liên kết: [10_plan.md](file:///d:/Documents/Web/WebHoaQua/.ai/runs/_current/10_plan.md)

### Implemented items (S1, S2 & S3)
- [x] (S1) DB, Auth Logic, Auth Views.
- [x] (S2) Intervention Modal, Client JS, Detail Page.
- [x] (S3) `src/modules/orders/orders.service.js`: Tạo đơn hàng nhanh cho guest, tự động map Customer theo SĐT.
- [x] (S3) `src/modules/orders/orders.controller.js`: Xử lý API quick-checkout và render trang Success.
- [x] (S3) `src/routes/api.route.js`: Đăng ký endpoint `/api/public/orders/quick-checkout`.
- [x] (S3) `src/app.js`: Kích hoạt API routes.
- [x] (S3) `src/views/public/checkout/success.ejs`: Giao diện thông báo thành công.

### Files changed
- NEW: `src/modules/orders/orders.service.js`.
- MODIFY: `src/modules/orders/orders.controller.js`.
- NEW: `src/routes/api.route.js`.
- MODIFY: `src/app.js` (API middleware).
- MODIFY: `src/views/public/checkout/success.ejs`.

### Test plan & Branch Matrix
| AREA / BEHAVIOR | HAPPY | VALIDATION | UNAUTH/PERM | NOT FOUND | UNEXPECTED | NOTES |
| --- | --- | --- | --- | --- | --- | --- |
| Guest Checkout API | OK | OK (Empty fields) | OK (Is guest) | N/A | OK | Manual post check |
| Success Page Render | OK | N/A | OK | N/A | N/A | Badge & order_code |

### Slice verification
- Lệnh: Manual browser test luồng Quick Purchase (Done).

### Context snapshot
- Goal slice: Quick Checkout API for Guest.
- Approach: Express API + Orders Service + Success View.
- Files touched: orders.service.js, orders.controller.js, api.route.js, success.ejs.


### 2026-04-01 15:57
- Feature: Auth Customer & Flexible Checkout
- Slice: S4 (Admin View Enhancements)
- Trạng thái: Done (implement-part)
- Liên kết: [10_plan.md](file:///d:/Documents/Web/WebHoaQua/.ai/runs/_current/10_plan.md)

### Implemented items (Total)
- [x] (S1) DB Schema & Auth Foundation: User-Customer link, Customer Register/Login logic.
- [x] (S1) Navbar: Tích hợp nút Đăng nhập / Dropdown Tài khoản.
- [x] (S2) UI Intervention Modal: Popup chọn "Đăng nhập" hoặc "Mua nhanh" cho khách vãng lai.
- [x] (S2) Product Detail: Tíc hợp JS để bắt sự kiện Thêm giỏ/Mua ngay.
- [x] (S3) Guest Quick Checkout: API đặt hàng nhanh dựa trên Số điện thoại, không yêu cầu tài khoản.
- [x] (S3) Success Page: Giao diện cảm ơn sau khi đặt hàng thành công.
- [x] (S4) Admin Orders: Dashboard quản lý đơn hàng hiển thị badge phân biệt "Thành viên" (Xanh) và "Khách vãng lai" (Xám).

### Files changed
- NEW: `src/modules/admin/orders/orders.controller.js`.
- MODIFY: `src/routes/admin.route.js` (Added admin order routes).
- NEW: `src/views/admin/orders/index.ejs`.
- NEW: `src/views/admin/orders/detail.ejs`.

### Test plan & Branch Matrix
| AREA / BEHAVIOR | HAPPY | VALIDATION | UNAUTH/PERM | NOT FOUND | UNEXPECTED | NOTES |
| --- | --- | --- | --- | --- | --- | --- |
| Admin Order List | OK | N/A | OK (isAdmin) | N/A | OK | Badge display user/guest |
| Admin Order Detail | OK | N/A | OK (isAdmin) | OK | OK | Customer type details |

### Slice verification
- Lệnh: Login admin -> /admin/orders (Done).

### Context snapshot
- Goal slice: Admin awareness of customer types.
- Approach: Admin controller with eager loading + Badge logic in views.
- Files touched: admin.route.js, admin orders controller, admin order views.


### 2026-04-01 16:09
- Feature: Unified Auth & Phase 2 Finalization
- Slice: S5 & S6
- Trạng thái: Done (implement-part)
- Liên kết: [10_plan_v2.md](file:///d:/Documents/Web/WebHoaQua/.ai/runs/_current/10_plan_v2.md)

### Implemented items (S5 & S6)
- [x] (S5) **Unified Login Controller**: Hợp nhất logic đăng nhập, xử lý redirect dựa trên role (Admin -> /admin, Customer -> /).
- [x] (S5) **Admin Routes Refactor**: Redirect `/admin/login` sang cổng đăng nhập chung `/auth/login`.
- [x] (S6) **Documentation Update**: Cập nhật `docs/phases/02-auth-admin.md` để bao gồm cả Customer Auth.
- [x] (S6) **Roadmap & README**: Cập nhật trạng thái Phase 2 thành "Hoàn thành" và bổ sung checklist.

### Files changed
- MODIFY: `src/modules/auth/auth.controller.js` (Unified logic).
- MODIFY: `src/routes/admin.route.js` (Cleanup and redirects).
- MODIFY: `docs/phases/02-auth-admin.md`.
- MODIFY: `docs/04-roadmap-checklist.md`.
- MODIFY: `README.md`.

### Test plan & Branch Matrix
| AREA / BEHAVIOR | HAPPY | VALIDATION | UNAUTH/PERM | NOT FOUND | UNEXPECTED | NOTES |
| --- | --- | --- | --- | --- | --- | --- |
| Admin Login (Unified) | OK | OK | OK (Redirect) | OK | OK | Phải về /admin |
| Customer Login (Unified) | OK | OK | OK (Redirect) | OK | OK | Phải về / |
| Alias Redirect | OK | N/A | OK | N/A | N/A | /admin/login -> /auth/login |

### Slice verification
- Lệnh: Manual browser test (Verified login/logout both roles).

### Context snapshot
- Goal slice: Unified auth & Updated docs.
- Approach: Role-based logic in one controller.
- Files touched: auth.controller.js, admin.route.js, doc files.

### ⚠️ CHECKPOINT: Logs Update
- [x] Đã kiểm tra `00_requirements_log.md`.

### 2026-04-02 10:35
- Feature: Phase 3 Category & Product
- Slice: S7 (Category Skeleton & List)
- Trạng thái: Done
- Liên kết: [10_plan_v3.md](file:///d:/Documents/Web/WebHoaQua/.ai/runs/_current/10_plan_v3.md)

### Implemented items (S7)
- [x] Tạo `src/modules/categories/categories.route.js`: Route `/` admin group.
- [x] Đăng ký `categoriesRoute` vào `src/routes/admin.route.js` (Prefix `/categories`).
- [x] Viết `src/modules/categories/categories.service.js`: Query `prisma.category.findMany`.
- [x] Viết `src/modules/categories/categories.controller.js`: Render view index với dữ liệu từ service.
- [x] Tạo `src/views/admin/categories/index.ejs`: Giao diện bảng danh mục BS5.

### Files changed
- NEW: `src/modules/categories/categories.route.js`.
- NEW: `src/modules/categories/categories.controller.js`.
- NEW: `src/modules/categories/categories.service.js`.
- MODIFY: `src/routes/admin.route.js` (Registered categories route).
- NEW: `src/views/admin/categories/index.ejs`.

### Test plan & Branch Matrix
| AREA / BEHAVIOR | HAPPY | VALIDATION | UNAUTH/PERM | NOT FOUND | UNEXPECTED | NOTES |
| --- | --- | --- | --- | --- | --- | --- |
| Category List Access | OK | N/A | OK (isAdmin) | N/A | OK | Browse /admin/categories |
| Empty Table State | OK | N/A | OK | N/A | OK | Show empty message |

### Slice verification
- Lệnh: `npm run dev` + Browse (Ready).

### Context snapshot
- Goal slice: Admin categories list foundation.
- Approach: Express + Prisma + EJS.
- Files touched: admin.route.js, categories module files, view index.

### 2026-04-02 10:45
- Feature: Phase 3 Category & Product
- Slice: S8 (Category CRUD + Upload)
- Tr?ng th�i: Done
- Li�n k?t: [10_plan_v3.md](file:///d:/Documents/Web/WebHoaQua/.ai/runs/_current/10_plan_v3.md)

### Implemented items (S8)
- [x] C?u h�nh `src/middlewares/upload.middleware.js`: S? d?ng `multer.memoryStorage` v� `cloudinary.uploader.upload_stream` d? gi?i quy?t v?n d? c�i d?t dependency.
- [x] Vi?t `src/utils/slug.js`: H�m chuy?n d?i Ti?ng Vi?t sang Slug.
- [x] T?o `public/js/slug-generator.js`: X? l� t?o slug ph�a Client.
- [x] Ho�n thi?n `src/modules/categories/categories.service.js`: Th�m `createCategory`, `updateCategory`, `deleteCategory` (c� check r�ng bu?c s?n ph?m).
- [x] Ho�n thi?n `src/modules/categories/categories.controller.js`: X? l� upload ?nh v� di?u ph?i CRUD.
- [x] T?o View `src/views/admin/categories/create.ejs` & `edit.ejs`.
- [x] C?p nh?t View `src/views/admin/categories/index.ejs`: Th�m AJAX delete script.

### Files changed
- NEW: `src/middlewares/upload.middleware.js`.
- MODIFY: `src/utils/slug.js`.
- NEW: `public/js/slug-generator.js`.
- MODIFY: `src/modules/categories/categories.service.js`.
- MODIFY: `src/modules/categories/categories.controller.js`.
- MODIFY: `src/modules/categories/categories.route.js`.
- NEW: `src/views/admin/categories/create.ejs`.
- NEW: `src/views/admin/categories/edit.ejs`.
- MODIFY: `src/views/admin/categories/index.ejs`.

### Test plan & Branch Matrix
| AREA / BEHAVIOR | HAPPY | VALIDATION | UNAUTH/PERM | NOT FOUND | UNEXPECTED | NOTES |
| --- | --- | --- | --- | --- | --- | --- |
| Create Category | OK | OK | OK | N/A | OK | Test upload ?nh OK |
| Update Category | OK | OK | OK | OK | OK | Thay ?nh OK |
| Delete Category | OK | OK (Check Prod) | OK | OK | OK | AJAX call OK |

### Slice verification
- L?nh: Manual test CRUD Categories (Ready).

### 2026-04-02 11:15
- Feature: Phase 3 Category & Product
- Slice: S9 (Product Skeleton & List)
- Tr?ng th�i: Done
- Li�n k?t: [10_plan_v3.md](file:///d:/Documents/Web/WebHoaQua/.ai/runs/_current/10_plan_v3.md)

### Implemented items (S9)
- [x] T?o `src/modules/products/products.route.js`: Route `/` admin.
- [x] �ang k� `productsRoute` v�o `src/routes/admin.route.js` (Prefix `/products`).
- [x] Vi?t `src/modules/products/products.service.js`: Query `prisma.product.findMany` k�m pagination, search v� filter category.
- [x] Vi?t `src/modules/products/products.controller.js`: Render view index v?i d?y d? logic filter.
- [x] T?o View `src/views/admin/products/index.ejs`: Giao di?n b?ng s?n ph?m hi?n d?i (Badge tr?ng th�i, d?nh d?ng gi� VND).

### 2026-04-02 11:20
- Feature: Phase 3 Category & Product
- Slice: S10 (Product CRUD & Slug)
- Tr?ng th�i: Done
- Li�n k?t: [10_plan_v3.md](file:///d:/Documents/Web/WebHoaQua/.ai/runs/_current/10_plan_v3.md)

### Implemented items (S10)
- [x] Ho�n thi?n `src/modules/products/products.service.js`: Th�m `createProduct`, `updateProduct`, `deleteProduct`. S? d?ng `Prisma.` d? d?ng b? ?nh v� log kho.
- [x] Ho�n thi?n `src/modules/products/products.controller.js`: X? l� upload da ?nh (t?i da 5), mapping d? li?u t? form v� x? l� c?p nh?t tr?ng th�i.
- [x] Ho�n thi?n View `src/views/admin/products/create.ejs` & `edit.ejs`: Giao di?n 2 c?t, h? tr? preview da ?nh, auto-slugify.

### 2026-04-02 11:45
- Feature: Phase 3 Category & Product
- Slice: S11 (Multi-Image Cloudinary)
- Tr?ng th�i: Done
- Li�n k?t: [10_plan_v3.md](file:///d:/Documents/Web/WebHoaQua/.ai/runs/_current/10_plan_v3.md)

### Implemented items (S11)
- [x] X? l� `upload.array('images', 5)` trong Products module.
- [x] H? tr? x�a ?nh cu khi update s?n ph?m.

### 2026-04-02 11:50
- Feature: Phase 3 Category & Product
- Slice: S12 (Inventory Management)
- Tr?ng th�i: Done
- Li�n k?t: [10_plan_v3.md](file:///d:/Documents/Web/WebHoaQua/.ai/runs/_current/10_plan_v3.md)

### Implemented items (S12)
- [x] Kh?i t?o module Inventory (Route, Controller, Service).
- [x] T�ch h?p logic t? d?ng ghi `InventoryLog` (import/adjust) khi t?o/s?a s?n ph?m.
- [x] T?o View `src/views/admin/inventory/index.ejs`: Hi?n th? d�ng th?i gian bi?n d?ng kho.

### 2026-04-02 12:00
- Feature: Phase 3 Category & Product
- Slice: S13 (Seeding & Final Polish)
- Tr?ng th�i: Done
- Li�n k?t: [10_plan_v3.md](file:///d:/Documents/Web/WebHoaQua/.ai/runs/_current/10_plan_v3.md)

### Implemented items (S13)
- [x] C?p nh?t `prisma/seed.js`: B? sung 3 danh m?c v� 4 s?n ph?m m?u chu?n SEO.
- [x] Ch?y `npx prisma db seed` (�� ho�n th�nh).
- [x] C?p nh?t Sidebar Admin: Th�m link Kho h�ng, fix logic `active` class linh ho?t theo URL.
- [x] C?u h�nh `src/app.js`: Truy?n `res.locals.req` d? h? tr? active state to�n h? th?ng.

## PHASE 4: PUBLIC SITE

### 2026-04-02 11:40
- Feature: Phase 4 Public Site
- Slice: S14 (Assets & Global Styles)
- Tr?ng th�i: Done
- Li�n k?t: [10_plan_v4.md](file:///d:/Documents/Web/WebHoaQua/.ai/runs/_current/10_plan_v4.md)

### Implemented items (S14)
- [x] C?p nh?t `src/views/layouts/main.ejs`: Import Google Fonts (Playfair Display & Outfit).
- [x] Vi?t m?i `public/css/style.css`: Thi?t l?p Design Tokens (Primary Green #1b4d3e), Typography (Heading/Body), v� c�c components co b?n (Buttons pill, Fruit Cards, Footer dark).

## PHASE 4: PUBLIC SITE (cont.)

### 2026-04-02 11:55
- Slice: S15 (Header & Footer)
- Tr?ng th�i: Done
- [x] app.js: Global middleware truy?n globalCategories v�o t?t c? views.
- [x] navbar.ejs: Dropdown danh m?c d?ng t? DB, Search bo tr�n, Cart badge.
- [x] footer.ejs: Brand, Categories, Newsletter form, Social icons.
- [x] main.ejs: Th�m Swiper CDN, Meta description d?ng, lo?i container c?ng.

### 2026-04-02 12:00
- Slice: S16+S17+S18 (Home Page ho�n ch?nh)
- Tr?ng th�i: Done
- [x] home.controller.js: Query featuredProducts + bestSellers c� images.
- [x] home/index.ejs: Hero, Categories Circles, Featured Products Grid, Promo Banner, Why Us, Testimonials, Blog Feed.

### 2026-04-02 12:05
- Slice: S19 (Shop Page)
- Tr?ng th�i: Done
- [x] public/products/products.controller.js: renderShop (filter q, category, sort, page).
- [x] public/products/shop.ejs: Sidebar filter, Product grid, Pagination.

### 2026-04-02 12:08
- Slice: S20 (Product Detail)
- Tr?ng th�i: Done
- [x] public/products/products.controller.js: renderDetail (includes images, related).
- [x] public/products/detail.ejs: Swiper gallery + thumbs, Price block, Specs, QTY, Tabs, Related.
