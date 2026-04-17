### 2026-04-15 16:55 (Round 1)
- Feature + slice phạm vi review: Phase 11 Slice 4 - cart shipping promotion + suggested add-to-cart reload
- Kết luận: SHIP WITH FOLLOW-UPS
- Lý do: logic hiển thị campaign ship trong cart đã được sửa đúng theo `type/value`, và luồng thêm từ block gợi ý đã đồng bộ lại trang cart. Tuy vậy repo hiện chưa có test tự động cho EJS/client flow nên vẫn còn follow-up về regression guard.

### BA/Plan Conformance Matrix
```text
ITEM (BA/PLAN)                                        STATUS   EVIDENCE                                        ACTION
----------------------------------------------------  -------  ----------------------------------------------  ------
Hiển thị đúng loại ưu đãi ship trong cart             DONE     `cart.controller.js`, `cart/index.ejs`          -
Hiển thị đúng campaign/voucher cho từng ngưỡng        DONE     `shippingPromotion.campaignName` trong view      -
Không hardcode mọi campaign thành freeship            DONE     summary + progress message đã dùng `benefitLabel` -
Add từ block gợi ý phải cập nhật cart ngay            DONE     `public/js/cart.js` reload khi pathname=/cart    -
Giữ scope trong Slice 4                               DONE     Chỉ chạm cart controller/view/script + roadmap   -
```

### Must-fix (Ship blockers)
- Không có blocker còn mở.

### Test & Coverage Gate
```text
TEST AREA / CHANGE SCOPE          STATUS   NOTES
--------------------------------  -------  ---------------------------------------------------------
Risk-based coverage (branches)    PARTIAL  Chưa có automation cho nhánh `amount` / `percent` / free ship
Anti-junk checks                  OK       Không thêm test hình thức hoặc mock rác
Branch matrix for critical flow   PARTIAL  Có xác nhận logic, thiếu test tự động unexpected-error
Coverage incremental guard        PARTIAL  Mới có syntax checks cho JS; chưa có suite cho EJS/client
Flaky risk                        OK       Reload chỉ chạy sau success và chỉ trên `/cart`
```

### Should-fix soon (Post-ship follow-ups)
- P1: bổ sung test render cart cho 3 loại campaign ship `amount`, `percent < 100`, `percent = 100`.
- P2: bổ sung UI smoke nhỏ cho nhánh `addToCart` khi đang ở `/cart`.

### Risk notes
- UX risk thấp: reload toàn trang ít mượt hơn patch DOM nhưng ổn định hơn cho trạng thái cart hiện tại.
- Regression risk trung bình: chưa có harness test cho EJS/client nên cần verify thủ công trước khi ship production.

### Style & Consistency notes
- Thay đổi giữ nguyên cấu trúc module hiện có của repo.
- Tên `shippingPromotion` rõ nghĩa hơn `freeship` và khớp BA đã chốt.

### Optional scope extension proposals
- Proposal: đồng bộ cùng logic hiển thị campaign ship sang checkout/cart summary helper dùng chung.
- Benefit: tránh lệch text giữa cart và checkout.
- Risk: mở rộng thêm scope ngoài fix hiện tại.
- Effort: S
- Recommend?: No

### Final verification steps
- `node --check src/modules/public/cart/cart.controller.js`
- `node --check public/js/cart.js`
- Verify thủ công tại `/cart` với 1 campaign `amount`
- Verify thủ công tại `/cart` với 1 campaign `percent`

### Recommendations log update
- Không phát sinh mục TODO mới cần thêm vào `.ai/runs/persist/00_recommendations_log.md`.

### 2026-04-15 18:15 (Round 2)
- Feature + slice phạm vi review: Phase 11 Slice 5 - Membership & Loyalty Points
- Kết luận: SHIP WITH FOLLOW-UPS
- Lý do: DB migration, checkout redeem/earn flow và hiển thị điểm ở checkout/profile đã có đủ để dùng feature. Điểm còn lại là Prisma client chưa regenerate được vì file lock và chưa có UI/integration automation cho nhánh coupon + points.

### BA/Plan Conformance Matrix
```text
ITEM (BA/PLAN)                                 STATUS   EVIDENCE                                              ACTION
---------------------------------------------  -------  ----------------------------------------------------  ------
Thêm `reward_points` vào User                  DONE     `prisma/schema.prisma`, migration loyalty            -
Thêm bảng `PointHistory`                       DONE     `PointHistory` model + migration SQL                  -
Cộng điểm sau checkout thành công              DONE     `checkout.service.js`, `loyalty.service.js`           -
Cho dùng điểm ở cart/checkout                  DONE     `checkout.controller.js`, `checkout/index.ejs`        -
Hiển thị số điểm cho user đăng nhập            DONE     `checkout/index.ejs`, `profile/index.ejs`             -
```

### Must-fix (Ship blockers)
- Không có blocker logic còn mở.

### Test & Coverage Gate
```text
TEST AREA / CHANGE SCOPE          STATUS   NOTES
--------------------------------  -------  ------------------------------------------------------------
Risk-based coverage (branches)    PARTIAL  Chưa có auto-test cho over-redeem / combined-discount cases
Anti-junk checks                  OK       Không thêm test hình thức
Branch matrix for critical flow   PARTIAL  Happy path đủ, thiếu unexpected-error automation
Coverage incremental guard        PARTIAL  Mới có migrate thật + syntax checks backend
Flaky risk                        OK       Loyalty backend nằm trong transaction; UI chỉ recalc local
```

### Should-fix soon (Post-ship follow-ups)
- P1: giải phóng file lock và chạy lại `npx prisma generate`.
- P1: thêm verify browser cho toggle dùng điểm khi có coupon/promotion.
- P2: hiển thị điểm đã dùng/nhận ở trang success hoặc lịch sử đơn hàng.

### Risk notes
- Rủi ro vận hành thấp-trung bình: feature hiện chạy bằng raw SQL cho phần loyalty mới để tránh phụ thuộc Prisma client stale.
- Rủi ro UX trung bình: tổng tiền checkout cần verify tay thêm vài tổ hợp khuyến mãi trước khi ship production.

### Style & Consistency notes
- Tách loyalty thành service riêng là hợp lý, giảm việc rải raw SQL trong controller.
- Scope vẫn nằm trong Slice 5, chưa mở rộng sang admin/analytics.

### Final verification steps
- `node --check src/modules/loyalty/loyalty.service.js`
- `node --check src/modules/public/checkout/checkout.service.js`
- `node --check src/modules/public/checkout/checkout.controller.js`
- Verify thủ công tại `/checkout` với user có điểm

### Recommendations log update
- Chưa thêm TODO mới vào `.ai/runs/persist/00_recommendations_log.md`; follow-up hiện được nêu ngay trong review này.
