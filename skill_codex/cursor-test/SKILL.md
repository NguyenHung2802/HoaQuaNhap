---
name: cursor-test
description: Kiểm thử theo chuẩn tech expert cho Antigravity. Dùng khi người dùng yêu cầu /test. Vừa chạy verification, vừa audit độ đầy đủ của test theo rủi ro và coverage (ưu tiên branches). Chống 'test rác' và 'phủ xanh hình thức'.
---

# Cursor Test (v3.1 — Expert-grade, Full Coverage, Anti-Junk)

## Mục tiêu
Đảm bảo thay đổi từ /implement được kiểm chứng **đủ sâu và đúng loại**, không chỉ “test pass”:
- Bắt đúng lỗi ở **nhánh lỗi/edge cases** (ưu tiên branches)
- Giảm rủi ro regress khi refactor
- Coverage tăng theo hướng **có giá trị**, tránh “phủ xanh bề mặt”

Skill này đóng vai trò:
- Executor: chạy lint/typecheck/build/audit/tests/coverage
- QA Lead: đánh giá test gaps theo rủi ro & coverage hotspots
- Guard: chặn merge nếu thiếu test quan trọng (BLOCKED)

Dùng khi người dùng yêu cầu /test. Vừa chạy verification, vừa audit độ đầy đủ của test theo rủi ro và coverage (ưu tiên branches). Chống 'test rác' và 'phủ xanh hình thức'. Output duy nhất: .ai/runs/_current/30_test.md.

---

## Guardrails (BẮT BUỘC)
- Đọc `AGENTS.md` trước khi bắt đầu.
- Nếu có `.codex/project-profile.md`, đọc và ưu tiên áp dụng.
- Đọc `.ai/runs/_current/10_plan.md` (đặc biệt verification plan).
- Đọc `.ai/runs/_current/20_implement.md` để xác định slice và file/module thay đổi.
- Không tạo bất kỳ report nào ngoài `.ai/runs/_current/30_test.md` (ngoại lệ hợp lệ: cập nhật nhật ký yêu cầu/đề xuất).
- **QUAN TRỌNG: Append-only Rule**:
  - KHÔNG ghi đè toàn bộ file `30_test.md`.
  - Luôn **append** kết quả test mới vào cuối file với timestamp.
  - Chỉ dọn dẹp file (truncate) khi bắt đầu feature hoàn toàn mới, chưa có nội dung gì trong file.
- Viết output bằng tiếng Việt có dấu.
- Bảng dùng fixed-width trong code block (không dùng `|`).
- Không paste log dài (chỉ tóm tắt và trích fingerprint 1–3 dòng).
- Không đổi test framework/kiến trúc test nếu không có yêu cầu rõ ràng.
- Reuse test utilities hiện có; tránh thêm dependency nặng trừ khi thật sự cần.
- **Mặc định chạy FULL suite với --coverage**, để có báo cáo coverage toàn diện cho toàn bộ dự án.
- Chỉ chạy phạm vi hẹp (slice-specific) khi user yêu cầu rõ ràng hoặc đang debug 1 test cụ thể.
- Coverage là **công cụ định hướng**, không phải mục tiêu tuyệt đối. Ưu tiên chất lượng theo rủi ro.

---

## Chế độ làm việc: Slice-aware + Risk-aware
- Nếu plan có Slice Plan:
  - Ưu tiên test sâu trong slice vừa implement và các điểm giao tiếp (boundary).
  - Full suite được khuyến nghị khi: thay đổi chạm shared libs/core flows/config.
- Nếu user không chỉ định slice:
  - Mặc định slice mới nhất trong `20_implement.md`.

---

## Nguyên tắc “Coverage có giá trị”
### Ưu tiên theo thứ tự
1) **Branches** (nhánh lỗi/edge cases) — quan trọng nhất
2) **Functions** (luồng chính được gọi thật)
3) **Statements/Lines** — để sau, tránh “xanh giả”

### Chống test rác (Anti-Junk Rules)
Một test bị coi là “rác” nếu:
- Assert quá chung chung (chỉ check 200/true) mà không xác nhận behavior/side effects
- Snapshot bừa bãi cho UI/layout/markup thay đổi thường xuyên
- Mock sai thực tế khiến test pass nhưng hệ thống fail
- Không kiểm chứng nhánh lỗi (validation/unauth/not found/unexpected error)
- Flaky (phụ thuộc timing/network/clock) mà không được kiểm soát

---

## Quy trình kiểm thử (chuẩn Expert)

### 1) Test Gap & Risk Analysis (BẮT BUỘC, trước khi chạy)
Từ diff/slice, trả lời:
- Module nào thay đổi? boundary với module khác ở đâu?
- Failure modes chính là gì? (validation, permission, not found, concurrency, integration, parsing, time, retries, v.v.)
- Với mỗi failure mode, loại test nào cần có?

Phân loại test theo “giá trị”:
- Unit (logic thuần, mapping/validation/transform)
- Integration (entrypoint/handler/service + DB/IO mocked/controlled)
- Contract/Schema (shape input/output ổn định)
- UI smoke (luồng sống còn, không test layout)
- E2E smoke (ít nhưng trúng, nếu dự án có)
- Security/Permission (khi có access control hoặc dữ liệu nhạy cảm)

### 2) Coverage Orientation (BẮT BUỘC)
Không chạy theo lines. Dùng coverage để:
- Xác định **top hotspots rủi ro** (file quan trọng nhưng branches thấp hoặc 0%)
- Xác định **điểm giao tiếp** dễ vỡ (adapters, validation, boundary)
- Đảm bảo PR **không làm coverage tụt** theo nguyên tắc incremental (nếu dự án có thể đo)

Nguyên tắc gate (phổ quát):
- Không đặt threshold cứng toàn repo nếu hiện coverage thấp.
- Thay bằng:
  - “Không được làm coverage tổng tụt” (incremental guard)
  - hoặc “Không được làm coverage tụt trong phạm vi thay đổi”
  - hoặc “Folder/module critical theo rủi ro phải đạt tối thiểu X% branches” (nếu project định nghĩa được)

Nếu project chưa có cơ chế gate:
- Đề xuất cách gate theo incremental trong report (không tự áp đặt làm CI chết).

### 3) Chạy pipeline chất lượng (Lint → Typecheck → Test+Coverage)
Mặc định:
1. Lint (nếu phù hợp với phạm vi test)
2. Typecheck (project + tests)
3. **Full Test Suite với Coverage**: `pnpm test --coverage` (hoặc tương đương)
4. Dependency audit (security) - chỉ khi cần thiết

**Lưu ý quan trọng:**
- Luôn chạy `pnpm test --coverage` (KHÔNG chỉ định file cụ thể) để coverage report phản ánh đầy đủ toàn bộ codebase.
- File `coverage/index.html` sẽ được tự động cập nhật sau khi chạy.
- `TEST_BASE_URL`: PHẢI dùng `http://leadup-crm.dev.localhost.com:3000`, KHÔNG dùng `localhost:3000`.
- `NODE_OPTIONS='--max-old-space-size=4096'`: tránh OOM khi chạy full suite 300+ tests.
- `--pool=forks --singleFork`: BẮT BUỘC — chạy tuần tự tránh race condition data `AUTOTEST_%`.
- `vitest.config.ts` phải exclude `tests/**/*.spec.{ts,tsx}` (file Playwright).

---

## ⚠️ Known Pitfalls

| Pitfall | Triệu chứng | Cách sửa |
|---------|-------------|----------|
| Race condition | `dbRows: []`, pass riêng fail full suite | `--pool=forks --singleFork` |
| OOM | Process bị kill đột ngột | `NODE_OPTIONS='--max-old-space-size=4096'` |
| Vitest chạy nhầm Playwright | `test.describe()` is not a function | Exclude `*.spec.ts` trong vitest config |
| Multiple elements | `Found multiple elements` | `container.querySelector('[data-field]')` thay `getByDisplayValue` |
| FK violations | `violates foreign key constraint` | Chạy tuần tự + xoá child trước parent |
| Rate limiting 429 | Quá nhiều request | Đảm bảo `NODE_ENV=test` |

---

## 📋 Test Conventions

Nếu dự án có pipeline khác:
- Ghi rõ lý do và tuân theo project-profile/plan.
- **Data prefix**: `AUTOTEST_` → cleanup `DELETE ... WHERE name LIKE 'AUTOTEST_%'`.
- **Fixtures**: `tests/fixtures/industries.ts`, `tests/helpers/fixtures.ts`.
- **Auth**: `tests/helpers/auth.ts` → `getAdminSession()` trả session cookie.
- **DB**: `import { db } from '@/lib/db'`, dùng chung pool với app.
- **E2E**: `tests/e2e/*.spec.ts` chạy riêng bằng `npx playwright test`, KHÔNG qua Vitest.

### 4) Thiết kế test case tối thiểu theo “Branch Matrix” (BẮT BUỘC)
Với mỗi entrypoint/behavior quan trọng, tối thiểu phải có:

- Happy path
- Validation error (bad input)
- Permission/unauthorized (nếu có khái niệm auth/role)
- Not found / missing resource (nếu có lookup)
- Unexpected error (exception path) — ít nhất 1 case đại diện

Ngoài ra chọn thêm 1–2 edge cases “đắt giá”:
- null/empty/encoding/timezone
- concurrency/idempotency/retry
- boundary size limits
- integration failure (3rd party down) nếu có

### 5) Failure Handling (khi test fail)
- Tóm tắt lỗi (fingerprint 1–3 dòng).
- Xác định lỗi thuộc loại:
  - Test setup/mocks sai
  - Code bug
  - Flaky/timing
  - Environment/config mismatch
- Chỉ sửa **tối thiểu cần thiết** để pass, không mở rộng scope.
- Nếu fail do thiếu test coverage nhánh quan trọng:
  - Đề xuất bổ sung test đúng loại (unit/integration/contract/e2e) và nêu rõ case nào sẽ khóa bug.

### 6) Log Review (nếu dự án có)
- Review log gần nhất liên quan thay đổi (tùy project: file logs/, console output, local service logs).
- Không bắt buộc “1 giờ gần nhất” nếu không có cơ sở; thay bằng:
  - “logs của lần chạy test/build hiện tại”
  - “logs của service local trong phiên làm việc”
- Chỉ tóm tắt signal quan trọng và map về module.

---

## Quality Gate (BẮT BUỘC trước khi PASS)
Một lần /test được coi là PASS khi:
- Lint/Typecheck/Build/Audit pass (hoặc được waive có lý do rõ)
- Tests liên quan phạm vi thay đổi pass
- Không còn “Test Gap nghiêm trọng” theo Risk Analysis
- Có tối thiểu Branch Matrix cho các behavior/entrypoints quan trọng
- Coverage không tụt theo nguyên tắc incremental (nếu có thể đo)
- Không có dấu hiệu test rác hoặc flaky chưa xử lý

Nếu chưa đạt:
- Trạng thái `BLOCKED` và ghi rõ điều kiện để unblock.

---

## Output bắt buộc: `.ai/runs/_current/30_test.md`

### 1) Header (cho mỗi lần chạy)
- Timestamp: YYYY-MM-DD HH:mm
- Feature / Task
- Slice đang test
- Trạng thái: PASS / FAIL / BLOCKED
- Tham chiếu: plan hiện tại và implement log mới nhất

### 2) Change & Risk Summary
- Files/modules changed (tóm tắt)
- Risk highlights (3–7 bullet)
- Boundaries touched (interfaces/entrypoints)

### 3) Test Gap Analysis (fixed-width table)
Trong code block:

```

TEST TYPE                 STATUS     NOTES

---

Unit                       OK         Logic thuần đã cover nhánh lỗi chính
Integration                PARTIAL    Thiếu case not-found cho 1 entrypoint
Contract/Schema             OK         Shape input/output đã kiểm tra
UI Smoke                   MISSING    Chưa có smoke cho luồng sống còn
E2E Smoke                  N/A        Dự án chưa có framework E2E
Security/Permission         OK         Có test unauthorized/forbidden
Regression (anti-break)    PARTIAL    Thiếu case edge/timezone
Flaky risk                 OK         Không thấy test phụ thuộc timing

```

### 4) Coverage Orientation
- Coverage command đã chạy
- Tóm tắt: branches/functions/statements (nếu có)
- Hotspots: top file/module rủi ro (branches thấp hoặc 0%) + gợi ý test loại gì
- Incremental guard:
  - Có đo được “tụt coverage” không?
  - Nếu có: kết luận “tụt/không tụt”
  - Nếu chưa: đề xuất cách đo/gate tối thiểu

### 5) Commands executed
- Lệnh đã chạy (copy/paste được)
- Phạm vi (slice-specific hay full)
- Thứ tự lint/typecheck/build/audit/test/coverage

### 6) Results
- Pass/fail summary
- Runtime/cảnh báo đáng chú ý (ngắn)

### 7) Failures & Fixes (nếu có)
- Failure fingerprint
- Root cause loại gì (test setup/code/env/flaky)
- File đã sửa (nếu có)

### 8) Branch Matrix Coverage (BẮT BUỘC)
Liệt kê entrypoints/behaviors quan trọng và trạng thái cover:

```

AREA / ENTRYPOINT            HAPPY   VALIDATION   UNAUTH/PERM   NOT FOUND   UNEXPECTED

---

X                            OK      OK           OK            MISSING     OK
Y                            OK      MISSING      N/A           OK          OK

```

### 9) Regression Checklist (3–10 bullet)
- [ ] Case A (edge)
- [ ] Case B (regression)
- [ ] Case C (boundary)

### 10) Notes & Recommendations
- Test cần bổ sung (ưu tiên theo rủi ro)
- Gợi ý hardening test utilities/mocks/time control (nếu cần)
- Điều kiện để ship an toàn

### 11) Log Review Summary (nếu áp dụng)
- Nguồn log đã kiểm tra
- Signal quan trọng (nếu có)
- Map về module thay đổi

---

## ⚠️ CHECKPOINT: Logs Update (BẮT BUỘC)
- [ ] Đã kiểm tra `00_requirements_log.md`: quá trình test có phát hiện hành vi sai với requirement gốc không? (Nếu có → update ngay).
- [ ] Đã kiểm tra `00_recommendations_log.md`: có phát hiện test gap / technical debt mới không? (Nếu có → ghi status TODO).