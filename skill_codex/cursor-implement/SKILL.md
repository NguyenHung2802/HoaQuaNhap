---
name: cursor-implement
description: Triển khai theo .ai/runs/_current/10_plan.md (slice-aware). Dùng khi người dùng yêu cầu /implement. Ưu tiên implement theo từng SLICE để giảm context full. Output chính .ai/runs/_current/20_implement.md (cập nhật nhật ký yêu cầu gốc khi có thay đổi)
---

# Cursor Implement (v2.1 — Slice-aware, SAFE, Test-first-for-risk)

## Mục tiêu
Triển khai theo 10_plan.md bằng các diff nhỏ, ưu tiên hoàn thành theo từng SLICE (vertical slice). Mỗi lần /implement chỉ nên xử lý 1 slice hoặc 1 phần rõ ràng của slice, để tránh context full và dễ verify.

**Bổ sung yêu cầu kiểm thử trong lúc code (anti-regress):**
- Không chỉ “code chạy”, mà phải kèm **test có giá trị** cho thay đổi quan trọng, ưu tiên **branches (nhánh lỗi/edge cases)** thay vì lines.
- Tránh “test rác”: assert chung chung, snapshot bừa bãi, mock sai thực tế, flaky.

Dùng khi người dùng yêu cầu /implement. Ưu tiên implement theo từng SLICE để giảm context full. Output chính: .ai/runs/_current/20_implement.md (cập nhật nhật ký yêu cầu gốc khi có thay đổi).

## Guardrails (BẮT BUỘC)
- Đọc `README.md` và thư mục `docs/` của dự án **WebHoaQua** trước khi bắt đầu.
- Nếu có `.codex/project-profile.md`, đọc và ưu tiên áp dụng.
- Đọc `.ai/runs/_current/00_requirements_log.md` và cập nhật khi có bổ sung/điều chỉnh trong quá trình chat.
- Mọi bổ sung/loại bỏ trong nhật ký yêu cầu gốc phải ghi ngày/giờ và lý do (nếu bỏ).
- Đọc `.ai/runs/_current/10_plan.md` (đặc biệt mục Slice Plan + checklist theo slice).
- Đọc file plan của slice mục tiêu tại `.ai/runs/_current/11_plan_slices/` (nếu có).
- Nếu có `.ai/runs/_current/00_ba.md`, đảm bảo không lệch scope so với BA đã chốt.
- Luôn dựa vào: project files + nhật ký yêu cầu gốc + BA + master plan + plan từng slice.
- Nếu có `.ai/runs/persist/00_recommendations_log.md`, theo dõi các đề xuất đang mở để xử lý dần trong từng slice.
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
- Không đổi kiến trúc ngoài kế hoạch. Nếu buộc phải đổi:
  - cập nhật `Plan adjustments` ở cuối 10_plan.md (WHAT/WHY/IMPACT)
  - và dừng lại để user xác nhận nếu thay đổi ảnh hưởng scope/approach.
- Khi thực hiện từng slice, nếu cần cập nhật master plan thì cập nhật lại plan hiện tại (`10_plan.md` hoặc version mới nhất).
- Không tạo bất kỳ file report nào ngoài `.ai/runs/_current/20_implement.md` (ngoại lệ hợp lệ: cập nhật plan, file plan slice, và 00_requirements_log.md khi cần).
- **QUAN TRỌNG: Append-only Rule**:
  - KHÔNG ghi đè toàn bộ file `20_implement.md` mỗi lần chạy.
  - Luôn **append** section mới vào cuối file với timestamp.
  - Chỉ dọn dẹp file (truncate) khi bắt đầu feature hoàn toàn mới, chưa có nội dung gì trong file.
- Viết output bằng tiếng Việt có dấu.
- Bảng dùng fixed-width trong code block (không dùng `|` markdown table).

**Guardrails bổ sung về test (trong implement):**
- Viết/điều chỉnh test **song song** với code thay đổi khi rủi ro không nhỏ (validation/edge cases/invariants/boundaries).
- Ưu tiên test theo “Branch Matrix”: happy path + validation error + unauthorized/permission (nếu có) + not found (nếu có) + unexpected error (đại diện).
- Không cố “phủ xanh” theo lines; tập trung **nhánh lỗi** và **side effects** (DB write/IO/state transitions) khi có.
- Không thêm dependency nặng, không đổi framework test; **reuse test utilities/mocks hiện có**.
- Tránh snapshot UI vô tội vạ; chỉ smoke test cho luồng quan trọng nếu cần.
- Nếu thay đổi có khả năng làm coverage tụt (hoặc tăng rủi ro regress), ghi rõ “incremental guard” cần kiểm trong /test (không gate cứng trong implement).

## Chế độ làm việc: Slice Execution Mode (BẮT BUỘC)
- Nếu plan có Slice Plan:
  - Yêu cầu người dùng chỉ định slice cần làm (S1/S2/...) trong câu lệnh /implement.
  - Nếu user không chỉ định, mặc định làm slice nhỏ nhất tiếp theo chưa hoàn thành (thường là S1).
- Mỗi lần /implement:
  - Chỉ triển khai 1 slice (hoặc tối đa 1 “sub-slice” rõ ràng) để giữ context gọn.
  - Không nhảy sang slice khác khi slice hiện tại chưa đạt DoD tối thiểu.

## Quy trình triển khai (theo tech expert)
1) Xác định SLICE mục tiêu:
   - Goal của slice
   - Deliverables
   - DoD & Verification commands (từ 10_plan.md)
2) Repo-grounding trước khi code:
   - Xác định file/module sẽ chạm theo repo patterns
   - Tìm chỗ “đúng để đặt code” (reuse pattern hiện có)
   - Không invent cấu trúc nếu đã có pattern trong repo
3) Implement theo lát mỏng:
   - Thay đổi nhỏ, commit-friendly
   - Ưu tiên “happy path” trước
   - Tạo/điều chỉnh test song song với code thay đổi theo rủi ro:
     - Tối thiểu cover “Branch Matrix” cho behavior/entrypoint quan trọng trong slice
     - Assert phải cụ thể (status + shape + side effects), tránh assert chung chung
     - Mock phải phản ánh thực tế; tránh setup bịa
4) Micro-verify (sanity check) ngay trong implement khi phù hợp:
   - typecheck/lint cục bộ hoặc chạy 1 test file liên quan (nếu plan có)
   - Không chạy full suite trừ khi cần
   - Nếu có thể: chạy coverage cục bộ theo phạm vi thay đổi để kiểm “branches hotspots” (không bắt buộc nếu dự án không hỗ trợ nhanh)
5) Sau khi hoàn thành mỗi slice:
   - Chạy verification commands của slice (theo plan)
   - Ghi kết quả vào 20_implement.md
   - Ghi rõ “Test intent” của slice: đã cover nhánh lỗi nào, còn thiếu nhánh nào (để /test hoàn thiện)
6) Nếu test fail:
   - Chỉ fix ngay nếu lỗi liên quan trực tiếp tới slice đang làm
   - Nếu lỗi không liên quan slice, phải hỏi user có muốn fix ngay không trước khi sửa
7) Nếu phát hiện thiếu thông tin hoặc scope drift:
   - Đề xuất quay lại /plan (hoặc /ba) trước khi đi tiếp
   - Đưa 1–3 phương án + tradeoff + khuyến nghị
8) Nếu đã xử lý đề xuất trong nhật ký:
   - Đánh dấu DONE trong `.ai/runs/persist/00_recommendations_log.md` (ghi ngày/giờ)
   - Có thể gỡ mục đã DONE để gọn (nêu rõ đã hoàn thành)

## Context Budget & Checkpoint Triggers (để tránh full context)
Trong quá trình implement, nếu xảy ra 1 trong các điều kiện sau thì:
- Ghi “Context snapshot” thật ngắn vào 20_implement.md
- Đề xuất tạo checkpoint và mở chat mới trước khi tiếp tục

Triggers:
- Đã sửa > 6–10 files trong slice
- Hoặc thay đổi > ~200–400 dòng
- Hoặc bắt đầu phát sinh log dài / debug kéo dài
- Hoặc phát hiện pattern mâu thuẫn khiến phải đọc nhiều file
- Hoặc chuẩn bị chuyển layer lớn (UI → API → DB) mà chưa chốt xong phần trước

## Output bắt buộc: `.ai/runs/_current/20_implement.md`
Ghi theo cấu trúc, ưu tiên append theo từng slice (mỗi slice là 1 section):

### Header (cho mỗi lần chạy)
- Timestamp: YYYY-MM-DD HH:mm
- Feature
- Slice đang thực hiện (S1/S2/...)
- Trạng thái: In progress / Blocked / Done (implement-part)
- Liên kết tới plan hiện tại (version mới nhất)

### Implemented items (theo checklist của slice)
- Liệt kê các checklist item đã làm (tick rõ)
- Liệt kê item còn lại trong slice

### Files changed (proof-based)
- NEW / MODIFY / DELETE
- Mỗi file ghi 1 dòng mô tả “đã thay đổi gì”

### Notes / Decisions
- Decision ngắn: WHAT + WHY
- Nếu có “Plan adjustments”: nhắc đã cập nhật vào 10_plan.md

### Test plan & Branch Matrix (BẮT BUỘC cho slice có rủi ro)
- Liệt kê behavior/entrypoint quan trọng trong slice
- Ma trận nhánh tối thiểu (happy/validation/unauth/not-found/unexpected)
- Nêu test nào đã viết trong implement, test nào để /test bổ sung (nếu cần)

Ví dụ bảng fixed-width trong code block:

````

AREA / BEHAVIOR                 HAPPY   VALIDATION   UNAUTH/PERM   NOT FOUND   UNEXPECTED   NOTES

---

X                               OK      OK           N/A           MISSING     OK           Need test for missing resource
Y                               OK      MISSING      OK            OK          MISSING      Add 2 tests in /test

```

### Micro-verify executed (nếu có)
- Lệnh đã chạy (ngắn)
- Kết quả: pass/fail (không paste log dài)

### Slice verification (BẮT BUỘC sau mỗi slice)
- Lệnh verification theo plan
- Kết quả: pass/fail (ngắn gọn)

### Open issues / Blocks
- Vướng mắc (nếu có)
- Đề xuất hướng xử lý (1–3 phương án + tradeoff)

### Context snapshot (BẮT BUỘC, cực ngắn)
- Goal slice
- Chosen approach (1 dòng)
- Files touched (list ngắn)
- Next actions (3–7 bullet)
- Verification to run in /test (1–3 lệnh)
- Coverage note (nếu phù hợp): hotspots/nhánh còn thiếu cần khóa trong /test + nguyên tắc incremental guard

```

### ⚠️ CHECKPOINT: Logs Update (BẮT BUỘC)
- [ ] Đã kiểm tra `00_requirements_log.md`: có phát sinh yêu cầu mới trong lúc code không? (Nếu có → update ngay).
- [ ] Đã kiểm tra `00_recommendations_log.md`: có phát sinh technical debt/refactor idea nào không? (Nếu có → ghi status TODO).