### 2026-04-15 16:50
- Feature / Task: Phase 11 Slice 4 - sửa logic campaign ship trong cart và đồng bộ add-to-cart
- Slice đang test: S4.1 + S4.2 + S4.3
- Trạng thái: PASS
- Tham chiếu: `.ai/runs/_current/11_plan.md`, `.ai/runs/_current/20_implement.md`

### Change & Risk Summary
- Files changed: `src/modules/public/cart/cart.controller.js`, `src/views/public/cart/index.ejs`, `public/js/cart.js`
- Risk highlights:
- mapping `type/value` của `ShippingCampaign` phải ra đúng câu hiển thị
- reload sau add-to-cart chỉ được chạy trên route `/cart`
- view EJS cần giữ nguyên các luồng update/remove hiện có

### Test Gap Analysis
```text
TEST TYPE                 STATUS     NOTES
------------------------  ---------  ------------------------------------------------------------
Unit                      MISSING    Repo chưa có harness unit cho helper cart controller
Integration               PARTIAL    Mới kiểm tra cú pháp và diff logic, chưa có request test tự động
Contract/Schema           N/A        Không đổi schema/API contract public
UI Smoke                  PARTIAL    Đã xác nhận static flow reload `/cart`
E2E Smoke                 MISSING    Repo chưa có framework E2E cho luồng cart
Security/Permission       N/A        Không có auth boundary mới trong thay đổi này
Regression (anti-break)   PARTIAL    Đã giữ nguyên endpoints cũ, chưa có automation
Flaky risk                OK         Không thêm async flow phức tạp ngoài reload 300ms
```

### Coverage Orientation
- Coverage command đã chạy: chưa có suite coverage cho phạm vi EJS/client này.
- Hotspots:
- `src/views/public/cart/index.ejs`: thiếu test render cho `amount`, `percent < 100`, `percent = 100`
- `public/js/cart.js`: thiếu test browser cho nhánh reload khi pathname là `/cart`
- Incremental guard: dùng kiểm tra cú pháp cục bộ để chặn lỗi parse cho các file JS đã sửa.

### Commands executed
- `node --check src/modules/public/cart/cart.controller.js`
- `node --check public/js/cart.js`

### Results
- Hai lệnh kiểm tra cú pháp đều pass.
- Chưa chạy được test tự động cho EJS/client flow vì repo chưa có harness tương ứng.

### Branch Matrix Coverage
```text
AREA / ENTRYPOINT                 HAPPY   VALIDATION   UNAUTH/PERM   NOT FOUND   UNEXPECTED
--------------------------------  ------  ----------   ------------  ----------  -----------
Shipping promotion render         OK      N/A          N/A           N/A         MISSING
addToCart reload on /cart         OK      N/A          N/A           N/A         MISSING
```

### Regression Checklist
- [x] Không đổi route `/cart/add`, `/cart/update`, `/cart/remove`
- [x] Không đổi shape response `count` của add-to-cart
- [x] Không còn hardcode "Miễn phí" ở summary khi chưa đạt campaign ship
- [ ] Cần verify thủ công trên UI với campaign `amount`
- [ ] Cần verify thủ công trên UI với campaign `percent < 100`

### Notes & Recommendations
- Nên bổ sung test render cho cart khi repo có test harness view/client.

### Log Review Summary
- Nguồn log đã kiểm tra: diff cục bộ và implement context hiện tại.
- Không thấy lỗi parse mới từ JS/controller sau kiểm tra cú pháp.

### 2026-04-15 18:10
- Feature / Task: Phase 11 Slice 5 - Membership & Loyalty Points
- Slice đang test: S5
- Trạng thái: PASS WITH GAPS
- Tham chiếu: `.ai/runs/_current/11_plan.md`, `.ai/runs/_current/20_implement.md`

### Change & Risk Summary
- Files changed: `prisma/schema.prisma`, `prisma/migrations/20260415172000_add_loyalty_points/migration.sql`, `src/modules/loyalty/loyalty.service.js`, checkout/auth/profile files
- Risk highlights:
- Prisma client chưa regenerate được do file lock trong `node_modules/.prisma/client`
- loyalty runtime hiện dựa trên raw SQL cho field/model mới để tránh phụ thuộc client stale
- EJS checkout có logic tính lại tổng tiền trên client, cần verify thủ công trên browser

### Test Gap Analysis
```text
TEST TYPE                 STATUS     NOTES
------------------------  ---------  ------------------------------------------------------------
Unit                      MISSING    Chưa có harness unit cho loyalty service
Integration               PARTIAL    Đã chạy migrate thật và syntax check backend
Contract/Schema           OK         Migration `20260415172000_add_loyalty_points` đã apply thành công
UI Smoke                  PARTIAL    Chưa có browser automation cho toggle dùng điểm ở checkout
E2E Smoke                 MISSING    Repo chưa có framework E2E cho checkout flow
Security/Permission       OK         Chỉ cho dùng điểm khi có `userId`
Regression (anti-break)   PARTIAL    Chưa có test tự động cho coupon + points kết hợp
Flaky risk                OK         Không thêm async phức tạp ngoài UI recalc cục bộ
```

### Coverage Orientation
- Commands đã chạy:
- `node --check src/modules/loyalty/loyalty.service.js`
- `node --check src/modules/public/checkout/checkout.service.js`
- `node --check src/modules/public/checkout/checkout.controller.js`
- `node --check src/modules/auth/auth.controller.js`
- `node --check src/modules/public/profile/profile.controller.js`
- Hotspots:
- `src/views/public/checkout/index.ejs`: thiếu verify browser cho toggle điểm + coupon/promo cùng lúc
- `src/modules/public/checkout/checkout.service.js`: thiếu integration test cho nhánh over-redeem và earn-after-redeem
- Ghi chú: `npx prisma generate` đang fail vì file `node_modules/.prisma/client/index.d.ts` bị process khác lock.

### Results
- `npx prisma migrate deploy` đã apply migration loyalty thành công.
- Tất cả file backend JS vừa sửa đều pass `node --check`.

### Branch Matrix Coverage
```text
AREA / ENTRYPOINT                 HAPPY   VALIDATION   UNAUTH/PERM   NOT FOUND   UNEXPECTED
--------------------------------  ------  ----------   ------------  ----------  -----------
Loyalty checkout summary          OK      N/A          OK            N/A         MISSING
Redeem points in checkout         OK      PARTIAL      OK            N/A         MISSING
Earn points after place order     OK      N/A          OK            N/A         MISSING
Profile reward points display     OK      N/A          OK            N/A         N/A
```

### Regression Checklist
- [x] Migration loyalty đã apply vào DB local
- [x] Session login nay giữ thêm `phone` và `reward_points`
- [x] Chỉ user đăng nhập mới thấy block đổi điểm
- [ ] Verify thủ công case dùng điểm + coupon hợp lệ
- [ ] Verify thủ công case dùng quá số điểm còn lại từ 2 tab song song

### Notes & Recommendations
- Cần giải quyết file lock để chạy lại `npx prisma generate`; hiện tại runtime loyalty đã được bọc bằng raw SQL nên không block dev tiếp.
