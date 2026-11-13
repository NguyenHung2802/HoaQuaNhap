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

### 2026-04-15 16:45
- Feature: Phase 11 Slice 4 (Cross-Selling / Cart UX)
- Slice: S4.1 + S4.2 + S4.3
- Tr?ng th�i: Done
- Li�n k?t: `.ai/runs/_current/11_plan.md`

### Implemented items (S4)
- [x] M? r?ng `src/modules/public/cart/cart.controller.js`: tr? v? `shippingPromotion` v?i `campaignType`, `discountValue`, `benefitLabel`, tr?ng th�i d?t ngu?ng v� c�u hi?n th? d�ng lo?i uu d�i ship.
- [x] S?a `src/views/public/cart/index.ejs`: b? hardcode freeship, hi?n th? d�ng campaign dang �p d?ng ho?c ngu?ng c�n thi?u cho gi?m ph� ship / gi?m % / freeship.
- [x] S?a `public/js/cart.js`: khi th�m s?n ph?m th�nh c�ng ngay t?i `/cart`, t? reload d? d?ng b? danh s�ch h�ng, t?ng ti?n v� block g?i �.

### Files changed
- MODIFY `src/modules/public/cart/cart.controller.js`: th�m helper d?ng metadata uu d�i v?n chuy?n cho UI.
- MODIFY `src/views/public/cart/index.ejs`: c?p nh?t progress bar, sidebar summary v� note campaign theo d�ng lo?i voucher ship.
- MODIFY `public/js/cart.js`: reload trang cart sau khi th�m s?n ph?m t? block g?i �.
- MODIFY `docs/04-roadmap-checklist.md`: ghi nh?n ti?n d? tinh ch?nh slice 4.

### Notes / Decisions
- Ch?n reload to�n trang khi th�m t? block g?i � t?i `/cart` thay v� patch DOM c?c b? v� trang cart c�n ph? thu?c progress campaign ship v� thu?t to�n g?i �.
- Gi? logic ch?n campaign active hi?n t?i, ch? s?a l?p hi?n th? d? kh�ng c�n hi?u sai th�nh freeship.

### Test plan & Branch Matrix
```text
AREA / BEHAVIOR                    HAPPY   VALIDATION   UNAUTH/PERM   NOT FOUND   UNEXPECTED   NOTES
---------------------------------  ------  ----------   ------------  ----------  -----------  ---------------------------------------------
Shipping promotion messaging       OK      N/A          N/A           N/A         PENDING      �� ki?m tra qua render path v� object mapping
Cart add from suggested products   OK      N/A          N/A           N/A         PENDING      Reload l?i /cart sau khi API add tr? success
```

### Micro-verify executed
- `node --check src/modules/public/cart/cart.controller.js`
- `node --check public/js/cart.js`

### Slice verification
- �� ch?y ki?m tra c� ph�p cho controller v� cart script sau khi s?a.

### Open issues / Blocks
- Chua c� test t? d?ng cho render EJS v� lu?ng client-side cart trong repo hi?n t?i.

### Context snapshot
- Goal slice: s?a text campaign ship v� d?ng b? UI cart sau add-to-cart t? block g?i �.
- Chosen approach: backend tr? metadata hi?n th?, frontend cart render tr?c ti?p v� reload ?n d?nh tr�n `/cart`.
- Files touched: `cart.controller.js`, `cart/index.ejs`, `public/js/cart.js`, `docs/04-roadmap-checklist.md`
- Next actions:
- ch?y review nhanh diff
- user ki?m tra l?i tr�n trang cart th?c t? v?i campaign percent/amount
- c�n nh?c th�m test UI smoke n?u repo b? sung harness sau
- Verification to run in /test:
- `node --check src/modules/public/cart/cart.controller.js`
- `node --check public/js/cart.js`
- Coverage note: hotspot c�n thi?u l� render EJS theo t?ng lo?i campaign ship v� client reload path tr�n `/cart`.

### 2026-04-15 18:05
- Feature: Phase 11 Slice 5 (Membership & Loyalty Points)
- Slice: S5
- Tr?ng th�i: Done
- Li�n k?t: `.ai/runs/_current/11_plan.md`

### Implemented items (S5)
- [x] C?p nh?t schema `User.reward_points` v� th�m b?ng `PointHistory` k�m migration `20260415172000_add_loyalty_points`.
- [x] T?o `src/modules/loyalty/loyalty.service.js` d? qu?n l� d?c di?m, t�nh di?m, tr? di?m v� c?ng di?m b?ng raw SQL trong transaction.
- [x] M? r?ng `checkout.service.js`: validate s? di?m d�ng, tr? di?m khi d?t h�ng, c?ng di?m thu?ng sau don th�nh c�ng.
- [x] M? r?ng `checkout.controller.js`: load loyalty summary cho user dang nh?p v� d?ng b? l?i di?m trong session sau checkout.
- [x] C?p nh?t UI `src/views/public/checkout/index.ejs`: hi?n th? s? di?m hi?n c�, cho b?t/t?t d�ng di?m v� c?p nh?t t?ng ti?n ngay tr�n client.
- [x] C?p nh?t auth/profile: session gi? th�m `phone`, `reward_points`; profile hi?n th? card s? di?m hi?n c�.

### Files changed
- MODIFY `prisma/schema.prisma`: th�m `reward_points`, `PointHistory`, relation li�n quan.
- ADD `prisma/migrations/20260415172000_add_loyalty_points/migration.sql`: migration loyalty points.
- ADD `src/modules/loyalty/loyalty.service.js`: service loyalty t�ch ri�ng.
- MODIFY `src/modules/public/checkout/checkout.service.js`: logic redeem/earn points trong transaction.
- MODIFY `src/modules/public/checkout/checkout.controller.js`: load loyalty summary cho checkout.
- MODIFY `src/views/public/checkout/index.ejs`: UI d�ng di?m ? checkout.
- MODIFY `src/modules/auth/auth.controller.js`: n?p reward points v�o session l�c login.
- MODIFY `src/modules/public/profile/profile.controller.js`: n?p reward points t? loyalty service.
- MODIFY `src/views/public/profile/index.ejs`: hi?n th? card di?m thu?ng.
- MODIFY `docs/04-roadmap-checklist.md`: ghi nh?n ti?n d? slice 5.

### Notes / Decisions
- Prisma client chua regenerate du?c v� file lock ? `node_modules/.prisma/client`, n�n loyalty runtime d�ng raw SQL d? kh�ng block feature.
- Quy d?i dang d�ng: 1 di?m = 1.000 VND, di?m nh?n th�m = 1% gi� tr? thanh to�n th?c t?, l�m tr�n xu?ng.
- UI checkout dang d�ng ki?u toggle �d�ng t?i da di?m h?p l? hi?n t?i� thay v� cho nh?p tay d? gi?m nh�nh l?i.

### Test plan & Branch Matrix
```text
AREA / BEHAVIOR                    HAPPY   VALIDATION   UNAUTH/PERM   NOT FOUND   UNEXPECTED   NOTES
---------------------------------  ------  ----------   ------------  ----------  -----------  ---------------------------------------------
Schema + migration loyalty         OK      N/A          N/A           N/A         N/A          `prisma migrate deploy` pass
Redeem reward points in checkout   OK      PARTIAL      OK            N/A         PENDING      Chua c� automation cho over-redeem/two-tab
Earn reward points after order     OK      N/A          OK            N/A         PENDING      �� c� logic transaction, thi?u integration test
Checkout loyalty UI                OK      PARTIAL      OK            N/A         PENDING      C?n verify browser khi di k�m coupon/promo
Profile reward points display      OK      N/A          OK            N/A         N/A          Render t? loyalty service
```

### Micro-verify executed
- `npx prisma migrate deploy`
- `node --check src/modules/loyalty/loyalty.service.js`
- `node --check src/modules/public/checkout/checkout.service.js`
- `node --check src/modules/public/checkout/checkout.controller.js`
- `node --check src/modules/auth/auth.controller.js`
- `node --check src/modules/public/profile/profile.controller.js`

### Slice verification
- Migration loyalty d� apply th�nh c�ng v�o DB local.
- C�c file backend JS v?a s?a d?u pass ki?m tra c� ph�p.
- `npx prisma generate` chua ho�n t?t do file lock `node_modules/.prisma/client/index.d.ts`.

### Open issues / Blocks
- C?n gi?i ph�ng process dang gi? lock Prisma client d? regenerate client khi thu?n ti?n.
- Chua c� test t? d?ng cho lu?ng EJS/browser c?a checkout loyalty.

### Context snapshot
- Goal slice: th�m membership/loyalty points cho user dang nh?p.
- Chosen approach: schema + raw-SQL loyalty service + t�ch h?p checkout/profile.
- Files touched: schema, migration, loyalty service, checkout/auth/profile, roadmap.
- Next actions:
- verify th? c�ng tr�n browser v?i user c� di?m
- ch?y l?i `npx prisma generate` sau khi file lock du?c gi?i ph�ng
- c�n nh?c hi?n th? di?m d�ng/nh?n ? success page n?u ti?p t?c polish
- Verification to run in /test:
- `node --check src/modules/loyalty/loyalty.service.js`
- `node --check src/modules/public/checkout/checkout.service.js`
- Coverage note: hotspot c�n thi?u l� branch coupon + points + promo v� race condition nhi?u tab checkout.

## 2026-07-29 10:20 — S40/S41: UI danh mục và dinh dưỡng

### Thay đổi
- Controller bổ sung `groupProductCount` từ count cha và các con, không thêm query.
- Shop thêm badge tổng nhóm, số mục con, chevron luôn hiện, click toggle và ARIA.
- Admin create/edit dùng Quill riêng cho dinh dưỡng, đồng bộ hidden input khi submit.
- Public detail render Quill; fallback escape an toàn cho dữ liệu plain text cũ.

### Verification
- `node --check src/modules/public/products/products.controller.js`: PASS.
- Compile 4 EJS bằng `ejs.compile`: PASS.
- `npx prisma validate`: PASS.
- `git diff --check` trên 5 file code: PASS (chỉ có cảnh báo line-ending).


## Plan v9 — S42 Nền dữ liệu (2026-11-12)
- Schema: BlogPost mở rộng + ApiKey + NewsStatDaily; migration `20261112100000_news_api_foundation`.
- Lọc `post_type='blog'`: home, blog công khai (list/detail/recent), admin blogs (list/count/edit).
- Seed Setting `news.*`.
- Verify: prisma validate/generate, node --check. Chưa áp migration lên DB (DB local tắt).

## Plan v9 — S43 Pipeline nội dung và media (2026-11-12)
- Mới: `src/modules/posts/content.service.js`, `src/modules/media/media.service.js`, `tests/s43-content-media.test.js`.
- Sửa: `src/middlewares/upload.middleware.js` (upload_stream thay base64), `package.json` (thêm sanitize-html).
- Verify: 45 kiểm tra đạt (Cloudinary giả lập). Chưa cài sanitize-html vào node_modules dự án (npm bị EPERM ở node_modules/fsevents).

## Plan v9 — S44 API key + API đăng bài (2026-11-12)
- Mới: `src/modules/api-keys/*`, `src/modules/posts/posts.service.js`, `src/modules/posts/posts.api.route.js`, `src/modules/settings/news-settings.service.js`, `src/middlewares/api-key.middleware.js`, `src/middlewares/rate-limit.middleware.js`, `src/views/admin/api-keys/index.ejs`, `docs/12-api-posts.md`, `tests/s44-api-posts.test.js`.
- Sửa: `src/app.js`, `src/routes/api.route.js`, `src/routes/admin.route.js`, `src/views/layouts/admin.ejs`, `src/config/env.js`, `.env.example`.
- Verify: 29/29 kiểm tra HTTP đạt (DB/Cloudinary giả lập). Chưa chạy với DB/Cloudinary thật.

## Plan v9 — S45 Admin tin tức ẩn (2026-11-12)
- Mới: `src/modules/news/*`, `src/views/admin/news/{index,form,preview,settings}.ejs`, `tests/s45-admin-news.test.js`.
- Sửa: `src/modules/posts/posts.service.js` (ad_image), `src/modules/blogs/blogs.controller.js` (chặn sửa/xóa news), `src/routes/admin.route.js`, `src/views/layouts/admin.ejs`.
- Verify: 19/19 (S45), 29/29 (S44), 45/45 (S43). Chưa chạy trên DB/Cloudinary thật; chưa xem bằng trình duyệt thật.

## Plan v9 — S46 Host routing + trang tin ẩn công khai (2026-11-12)
- Mới: `src/middlewares/news-host.middleware.js`, `src/modules/public/news/*`, `src/views/news/{show,404}.ejs`, `docs/13-news-subdomain.md`, `docs/mockups/xem-thu-trang-tin-an.html`, `tests/s46-news-public.test.js`.
- Sửa: `src/app.js` (gắn middleware host trước cors/session).
- Verify: 18/18 (S46), 19/19 (S45), 29/29 (S44), 45/45 (S43). Chưa chạy trên Nginx/DB/Cloudinary thật.

## Plan v9 — S47 Popup affiliate + thống kê (2026-11-12)
- Mới: `public/news-assets/news.js`, `src/modules/news-stats/news-stats.service.js`, `src/views/admin/news/stats.ejs`, `tests/s47-popup-stats.test.js`.
- Sửa: `src/views/news/show.ejs` (CSS popup/banner, nhúng cấu hình), `src/modules/public/news/*` (beacon /t, đếm lượt vào, cache static), `src/modules/news/*` (trang thống kê, flush), `src/views/admin/news/{index,form}.ejs`, `src/server.js`.
- Verify: 22/22 (S47) + S43–S46 vẫn đạt; thử popup bằng trình duyệt thật trên máy chủ giả lập (X, nền mờ, Esc, bấm thân, banner, mobile 375px).

## Plan v9 — S48 Trang bài viết chuyên nghiệp (2026-11-12)
- Mới: `src/modules/posts/article.service.js`, `tests/s48-article.test.js`.
- Sửa: `src/modules/public/blogs/blogs.controller.js`, `src/views/public/blogs/detail.ejs`, `src/views/layouts/main.ejs` (canonicalUrl, headExtra), `src/modules/posts/content.service.js` (jsonForScript, escapeHtml), `src/modules/public/news/news.public.controller.js` (dùng chung jsonForScript).
- Verify: 17/17 (S48) + S43–S47 vẫn đạt; xem bằng trình duyệt desktop và mobile.

## Plan v9 — S49 Vận hành VPS 1GB (2026-11-12)
- Mới: `src/utils/category-cache.js`, `scripts/backup-db.js`, `docs/14-vps-1gb-operations.md`, `tests/s49-ops.test.js`.
- Sửa: 24 file thay `new PrismaClient()` bằng `require('.../config/db')`; `src/config/db.js`, `src/app.js` (cache menu, /healthz), `src/modules/categories/categories.service.js`, `ecosystem.config.js`, `package.json`, `docs/09-pm2-operations.md`, `docs/10-self-host-n8n.md`.
- Verify: 15/15 (S49) + S43–S48 vẫn đạt. Chưa chạy trên VPS thật.

## Plan v9 — S51 Design system + layout chung v2 (2026-11-12)
- Mới: `public/css/theme-v2.css`, `public/js/theme-v2.js`, `src/views/partials/mini-cart.ejs`, `docs/15-ui-theme-v2.md`, `tests/s51-theme-v2.test.js`.
- Sửa: `src/views/layouts/main.ejs` (cờ theme, nạp v2), `src/app.js` (res.locals.uiTheme), `src/modules/public/cart/cart.controller.js` + `cart.route.js` (GET /cart/mini).
- Verify: 13/13 (S51) + S43–S49 vẫn đạt; xem bằng trình duyệt desktop/mobile. Chưa xem các trang shop/chi tiết/checkout.

## Plan v9 — S52 Trang chủ v2 (2026-11-12)
- Mới: `public/css/home-v2.css`, `tests/s52-home-v2.test.js`.
- Sửa: `src/views/public/home/index.ejs` (nhánh hero v2, nhánh classic giữ nguyên), `public/css/theme-v2.css` (overflow-x clip).
- Verify: 8/8 (S52) + S43–S51 vẫn đạt; xem desktop/mobile bằng trình duyệt thật với banner mẫu.

## Plan v9 — S53 Shop + chi tiết sản phẩm v2 (2026-11-12)
- Mới: `public/css/shop-v2.css`, `public/js/shop-v2.js`, `public/js/product-v2.js`, `tests/helpers/fake-shop-prisma.js`, `tests/s53-shop-v2.test.js`.
- Sửa: `src/views/public/products/shop.ejs` (mốc id, nút thêm nhanh v2, nạp asset v2), `src/views/public/products/detail.ejs` (nạp asset v2), `src/modules/public/products/products.controller.js` (view 404 đúng).
- Verify: 14/14 (S53) + S43–S52 vẫn đạt; xem desktop/mobile bằng trình duyệt thật (lọc AJAX, Back, thêm nhanh, thanh mua dính, bộ lọc gập).

## Plan v9 — S54 Giỏ hàng + thanh toán v2 (2026-11-12)
- Mới: `src/views/partials/order-steps.ejs`, `public/css/cart-v2.css`, `public/js/cart-v2.js`, `tests/s54-cart-checkout-v2.test.js`.
- Sửa: `src/views/public/cart/index.ejs`, `src/views/public/checkout/index.ejs`, `src/views/public/checkout/success.ejs` (chỉ chèn thanh tiến trình + nạp asset v2).
- Verify: 11/11 (S54) + S43–S53 vẫn đạt; form/script thanh toán giống hệt classic; xem giỏ hàng desktop/mobile và thanh toán desktop bằng trình duyệt thật. Chưa chạy đặt hàng thật.

## Plan v9 — S55 Tối ưu tốc độ tải v2 (2026-11-12)
- Mới: `public/vendor/*` (bootstrap, fontawesome, swiper, sweetalert2, fonts), `tests/s55-performance.test.js`.
- Sửa: `src/views/layouts/main.ejs`, `src/app.js` (/vendor cache dài), `public/js/theme-v2.js`, `public/css/theme-v2.css`, `public/css/home-v2.css`, `src/views/public/home/index.ejs`, `src/views/partials/footer.ejs`, tests S52/S54.
- Verify: đo trình duyệt thật trước/sau (DCL 3510→415ms); 12/12 (S55) + toàn bộ test cũ đạt.

## Sửa lỗi sitemap (2026-11-13)
- `src/modules/public/pages/pages.controller.js` + `src/views/public/seo/sitemap.ejs`: dùng `prisma.blogPost` (blog đã đăng, loại tin ẩn), URL blog theo slug, danh mục theo `?category=<slug>`, bỏ trang tĩnh trùng/404, ưu tiên `SITE_URL`.
- Mới: `tests/s56-sitemap.test.js` (5 kiểm tra đạt). Phát hiện khi bật web thật và gọi 21 đường dẫn chính.
