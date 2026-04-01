---
name: cursor-review
description: Review theo chuẩn tech expert cho Antigravity. Dùng khi người dùng yêu cầu /review. Review không chỉ diff mà còn đối chiếu BA/Plan/Test, đánh giá DB/security/style/refactor và đề xuất scope extension có kiểm soát.
---

# Cursor Review (v2.2 — Expert-grade, Full Coverage Check)

## Mục tiêu
Đánh giá mức “ship-ready” của thay đổi theo 3 lớp:
1) Conformance: đúng BA/Plan hay chưa, có sót/hỏng yêu cầu nào không
2) Quality: correctness, security, performance, maintainability, compatibility
3) System health: DB design, auth/roles, style consistency, refactor opportunities

Dùng khi người dùng yêu cầu /review. Review không chỉ diff mà còn đối chiếu BA/Plan/Test, đánh giá DB/security/style/refactor và đề xuất scope extension có kiểm soát. Output duy nhất: .ai/runs/_current/40_review.md.

Review phải đưa ra kết luận rõ:
- SHIP / SHIP WITH FOLLOW-UPS / BLOCKED

## Guardrails (BẮT BUỘC)
- Đọc `AGENTS.md` trước khi bắt đầu.
- Nếu có `.codex/project-profile.md`, đọc và ưu tiên áp dụng.
- Đọc các artifacts:
  - `.ai/runs/_current/00_ba.md` (nếu có)
  - `.ai/runs/_current/10_plan.md`
  - `.ai/runs/_current/20_implement.md`
  - `.ai/runs/_current/30_test.md`
  - `.ai/runs/persist/00_recommendations_log.md`
- Nếu `.ai/runs/persist/00_recommendations_log.md` chưa tồn tại, tạo file mới theo template header sau để đồng bộ giữa các task:
  - Header (text thường):
    - `# NHẬT KÝ ĐỀ XUẤT`
    - `- Ngày tạo: YYYY-MM-DD`
    - `- Định dạng: bảng fixed-width trong code block (không dùng bảng markdown)`
  - Table header (code block):
    ```
    TYPE        STATUS   NGÀY        BỐI CẢNH                  MÔ TẢ
    ----------  -------  ----------  ------------------------  ----------------------------------------
    ```
- Review theo slice nếu plan có Slice Plan:
  - Nếu chỉ implement/test 1 slice: review tập trung slice đó
  - Nếu đã xong nhiều slice: review theo từng slice + tổng hợp hệ thống
- Nếu có must-fix:
  - Ưu tiên sửa ngay nhưng KHÔNG mở rộng scope ngoài BA/Plan đã chốt
  - Nếu sửa thay đổi logic, yêu cầu chạy /test lại
- Nếu phát hiện vấn đề ảnh hưởng scope/approach:
  - Đề xuất quay lại /plan (hoặc /ba) trước khi tiếp tục
- Chỉ ghi output vào `.ai/runs/_current/40_review.md` (ngoại lệ hợp lệ: cập nhật nhật ký yêu cầu/đề xuất/repo map).
- **QUAN TRỌNG: Append-only Rule**:
  - KHÔNG ghi đè toàn bộ file `40_review.md`.
  - Luôn **append** kết quả review mới vào cuối file với timestamp (Round 1, Round 2...).
  - Chỉ dọn dẹp file (truncate) khi bắt đầu feature hoàn toàn mới.
- Viết bằng tiếng Việt có dấu.
- Nếu cần bảng: fixed-width table trong code block (không dùng bảng markdown `|`).
- Tổng hợp các đề xuất từ plan/implement/review và cập nhật nhật ký đề xuất tại `.ai/runs/persist/00_recommendations_log.md`:
  - Ghi rõ bối cảnh task (tóm tắt ngắn)
  - Mỗi đề xuất: loại (must/nice-to/scope/security/other), mô tả, trạng thái (TODO/DONE), ngày đề xuất
  - Nếu đề xuất đã được thực hiện, có thể loại khỏi nhật ký để gọn (ghi lại lịch sử ngắn nếu cần)
  - **HARD GATE**: Không được kết thúc review nếu chưa cập nhật file này.

---

## Quy trình review (chuẩn tech expert / Opus)

### 1) Quick inventory (Proof-based)
- Tóm tắt những gì đã thay đổi (theo 20_implement.md + diff thực tế)
- Các thành phần: DB / API / UI / Auth / Tests

### 2) BA/Plan Conformance Review (BẮT BUỘC)
Đối chiếu BA & Plan:
- Những yêu cầu Must/Should đã được làm đủ chưa?
- Có phần nào bị làm sai/khác plan không?
- Có phần nào “đáng lẽ phải có” mà bị quên (đặc biệt validation, edge cases, permissions, error states)?
- Verification plan trong 10_plan.md đã được chạy đủ chưa?

Kết quả conformance phải ra bảng:
- BA item → status (DONE/PARTIAL/MISSING/DEVIATED) → evidence (file/behavior) → action

### 3) Quality Review (Checklist mở rộng)
Review theo các nhóm:
- Correctness (logic, states, validation, error handling)
- Security (auth, roles, PII, injection, exposure)
- Data/DB (schema, constraints, indexes, migration safety, rollback)
- Performance (query patterns, pagination, N+1, caching, payload size)
- Maintainability (structure, naming, separation of concerns, duplication)
- Compatibility (backward compatibility, API changes, migrations)
- Observability (logging, audit trail khi cần)

### 3.1) Test & Coverage Review (BẮT BUỘC)
Đối chiếu `.ai/runs/_current/30_test.md` và diff để đánh giá **độ đủ test có giá trị** (không chạy theo lines):
- Test strategy có bám theo rủi ro của thay đổi không?
- Có tránh “test rác” không (assert quá chung chung, snapshot bừa bãi, mock sai thực tế, flaky)?
- **Verify Full Coverage đã chạy**: Đảm bảo `30_test.md` xác nhận đã chạy `pnpm test --coverage` (full suite, không phải slice-specific).
- Coverage dùng đúng cách chưa: có chỉ ra hotspots (đặc biệt branches thấp/0% ở phần quan trọng) và đã có kế hoạch tăng coverage theo nhánh lỗi chưa?
- Với các entrypoints/behaviors quan trọng: tối thiểu phải có ma trận nhánh:
  - happy path
  - validation error
  - unauthorized/permission (nếu có khái niệm truy cập)
  - not found (nếu có lookup)
  - unexpected error (exception path đại diện)
- Nếu dự án chưa thể gate coverage cứng:
  - yêu cầu **incremental guard**: PR/slice không được làm coverage tụt (tổng hoặc trong phạm vi thay đổi)
  - hoặc yêu cầu “không tụt branches coverage” ở phạm vi thay đổi quan trọng (nếu đo được)

Nếu phát hiện “test gap nghiêm trọng” hoặc coverage tụt theo nguyên tắc incremental:
- Phân loại MUST-FIX (block ship) hoặc SHOULD-FIX (follow-up) rõ ràng

### 4) Style & Consistency Review (BẮT BUỘC khi có code mới)
Đánh giá:
- Code style mới có lệch nhiều so với codebase không?
- Có tuân conventions folder/file, naming, error patterns, hooks/services patterns?
- Có phần nào “invent pattern” không cần thiết?
- Nếu cần, đề xuất refactor nhỏ để đồng nhất (nhưng không mở scope lớn)

### 5) Refactor & Scope extension proposals (có kiểm soát)
Skill được phép đề xuất mở rộng phạm vi, nhưng phải phân loại rõ:

- MUST-FIX (bắt buộc để ship): bug/security/data integrity/test gap
- SHOULD-FIX (nên làm sớm sau ship): chất lượng/maintainability/risk vừa
- OPTIONAL SCOPE EXTENSION (mở rộng có lợi nhưng không bắt buộc):
  - chỉ đề xuất tối đa 3 mục
  - phải nêu lợi ích, rủi ro, effort ước lượng
  - không tự ý implement nếu user chưa đồng ý

### 6) Final Gate & Next Steps
- Kết luận: SHIP / SHIP WITH FOLLOW-UPS / BLOCKED
- Nếu SHIP WITH FOLLOW-UPS: liệt kê follow-ups rõ ràng + mức ưu tiên
- “Final verification steps”: lệnh copy/paste chạy được (tối thiểu 2–4 lệnh)
- Nếu có must-fix liên quan test/coverage: yêu cầu /test chạy lại sau khi bổ sung

---

## Output bắt buộc: `.ai/runs/_current/40_review.md`

### 1) Header (cho mỗi lần chạy)
- Timestamp: YYYY-MM-DD HH:mm (Round N)
- Feature + slice phạm vi review
- Kết luận: SHIP / SHIP WITH FOLLOW-UPS / BLOCKED (kèm lý do 2–4 dòng)

### 2) BA/Plan Conformance Matrix (fixed-width)
````

ITEM (BA/PLAN)                         STATUS     EVIDENCE                           ACTION

---

Must: Admin list employees              DONE       components/.../employee-table.tsx  -
Must: Role admin check for endpoints    PARTIAL    api/.../route.ts (GET ok, POST ?)  Add check in POST
Should: Debounce 300ms                  DONE       employee-filters.tsx               -
...

```

### 3) Must-fix (Ship blockers)
- Danh sách must-fix + status (fixed/not fixed)
- Nếu đã fix trong review: liệt kê files changed + yêu cầu /test lại nếu cần

### 3.1) Test & Coverage Gate (BẮT BUỘC, fixed-width)
Tóm tắt mức độ đủ test theo rủi ro và nhánh lỗi:

```

TEST AREA / CHANGE SCOPE        STATUS     NOTES

---

Risk-based coverage (branches)  OK         Nhánh lỗi chính đã có test
Anti-junk checks               PARTIAL    Có 1 test assert quá chung chung
Branch matrix for critical flow MISSING    Thiếu not-found + unexpected-error case
Coverage incremental guard      OK         Không thấy dấu hiệu coverage tụt (nếu đo được)
Flaky risk                      OK         Không thấy test phụ thuộc timing

```

### 4) Should-fix soon (Post-ship follow-ups)
- Danh sách theo ưu tiên (P1/P2/P3)

### 5) Risk notes
- Security risks (PII, permission leaks, reset password exposure)
- Data integrity risks (missing constraint/index, migration safety)
- Performance risks (pagination, query cost)
- UX risks (loading/empty/error states)

### 6) Style & Consistency notes
- Điểm lệch style (nếu có)
- Đề xuất refactor nhỏ để đồng nhất (không bắt buộc)

### 7) Optional scope extension proposals (tối đa 3)
Mỗi mục ghi:
- Proposal
- Benefit
- Risk
- Effort (S/M/L)
- Recommend? (Yes/No)

### 8) Final verification steps (copy/paste)
- Lệnh cần chạy trước ship:
  - Typecheck: `pnpm typecheck` và `pnpm typecheck:tests`
  - Lint: `pnpm lint`
  - **Full Test Suite + Coverage**: `pnpm test --coverage` (BẮT BUỘC để cập nhật `coverage/index.html`)
- Nếu chạy trong docker: dùng đúng prefix đã chốt trong plan
- Nếu có bổ sung test: yêu cầu chạy lại `pnpm test --coverage` để xác nhận coverage không tụt

### 9) Recommendations log update (BẮT BUỘC)
- Tóm tắt các mục đã thêm vào `.ai/runs/persist/00_recommendations_log.md`
- Tóm tắt các mục đã đánh dấu DONE (nếu có)

---

## ⚠️ CHECKPOINT CUỐI: Repo Map & Logs (HARD GATES)
Trước khi kết thúc phiên Review, PHẢI thực hiện 3 việc sau (không được bỏ qua):

1. **Requirements Log Check**:
   - Review `00_requirements_log.md`.
   - Update nếu có thay đổi scope thực tế so với ban đầu.

2. **Recommendations Log Check**:
   - Khẳng định đã ghi tất cả issue (chưa fix) vào `00_recommendations_log.md`.

3. **Repo Map Update (QUAN TRỌNG)**:
   - Hỏi user: "Feature này có thêm file mới / thay đổi cấu trúc quan trọng không?"
   - Nếu có: Đề xuất chạy `repo-index` ngay lập tức để cập nhật `00_repo_map_overview.md`.
   - Nếu user đồng ý: chạy lệnh update map.
   - Nếu không update: map sẽ bị outdated cho task sau.

Xác nhận: "Đã hoàn thành 3 checkpoints trên" trước khi dừng.