---
name: cursor-plan
description: Lập kế hoạch triển khai cho Antigravity. Dùng khi người dùng cần tạo kế hoạch chặt chẽ để implement theo từng slice.
---

# Cursor Plan (v2 — Slice-aware, SAFE)

## Mục tiêu
Tạo kế hoạch triển khai chặt chẽ, có thể thi công theo từng lát mỏng (slice) để:
- Giảm rủi ro context full giữa flow
- Mỗi slice đều có DoD + verification commands rõ ràng
- Có checkpoint points để reset chat an toàn
- Tối ưu cho bước /implement chạy theo slice

Dùng khi người dùng yêu cầu /plan hoặc cần tạo kế hoạch chặt chẽ để implement theo từng slice. Output chính: .ai/runs/_current/10_plan.md + file plan riêng cho từng slice tại .ai/runs/_current/11_plan_slices/ (sau khi chốt), không tạo ra artifact nào khác.

## Guardrails (BẮT BUỘC)
- Đọc `README.md` và thư mục `docs/` của dự án **WebHoaQua** trước khi bắt đầu.
- Nếu có `.codex/project-profile.md`, đọc và ưu tiên áp dụng.
- Đảm bảo repo map đã có/cập nhật (repo-index). Nếu chưa có, đề xuất chạy repo-index trước khi plan.
- Nếu có `.ai/runs/_current/00_ba.md` (và các addendum `00_ba_v*_addendum.md`), dùng làm input chính. Nếu BA chưa chốt (thiếu quyết định/phạm vi), đề xuất quay lại /ba.
- Nếu có `.ai/runs/_current/18_research_summary.md`, dùng để chốt approach và phản ánh vào Options/Recommended approach.
- Luôn đọc và cập nhật `.ai/runs/_current/00_requirements_log.md` khi có bổ sung/điều chỉnh trong quá trình chat.
- Mọi bổ sung/loại bỏ trong nhật ký yêu cầu gốc phải ghi ngày/giờ và lý do (nếu bỏ).
- Nếu có `.ai/runs/persist/00_recommendations_log.md`, xem các đề xuất liên quan để cân nhắc kết hợp vào plan hiện tại.
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
- Không viết code ở bước plan.

### ⚠️ QUY TẮC VERSIONING (QUAN TRỌNG — KHÔNG GHI ĐÈ)
- **Lần đầu** chạy `/plan` cho feature hiện tại → tạo `10_plan.md`.
- **Các lần sau** (sau review phát sinh bổ sung, sau BA addendum mới, sau khi scope thay đổi):
  - KHÔNG ghi đè `10_plan.md` gốc.
  - Tạo plan version mới: `10_plan_v{N}.md` (N tăng dần, bắt đầu từ 2).
  - Tự detect số version tiếp theo bằng cách đếm file `10_plan_v*` có trong `.ai/runs/_current/`.
  - File plan mới phải:
    - Tham chiếu `10_plan.md` gốc (và các version trước nếu có) ở đầu file.
    - Ghi rõ ngày/giờ tạo + lý do tạo version mới.
    - Chỉ ghi **phần bổ sung/thay đổi** so với plan trước, không copy lại toàn bộ.
    - Nếu có mục trong plan cũ bị thay đổi, ghi rõ: "Thay thế/điều chỉnh mục X trong 10_plan.md".
  - Cấu trúc plan version mới:
    ```
    # Plan v{N} — [Tên feature]
    - Ngày: YYYY-MM-DD HH:mm
    - Tham chiếu: 10_plan.md (và các version trước nếu có)
    - Lý do bổ sung: [tóm tắt — VD: phát sinh từ review round 2, BA addendum v3]
    - BA nguồn: 00_ba.md + 00_ba_v{N}_addendum.md (nếu có)

    ## Bổ sung / Thay đổi so với plan trước
    [Nội dung mới]

    ## Slice mới (nếu có)
    [Chỉ liệt kê slice MỚI, không lặp lại slice cũ]
    ```
- **File slice plan hiện có** (`11_plan_slices/S*.md`): KHÔNG ghi đè trừ khi chính slice đó có bổ sung cụ thể từ plan version mới.
  - Nếu plan mới thêm slice, đánh số TIẾP THEO (VD: đã có S1-S8, slice mới bắt đầu từ S9).
  - KHÔNG đánh lại số thứ tự slice cũ.
- **File report** (`20_implement.md`, `30_test.md`, `40_review.md`): KHÔNG ghi đè — chỉ append section mới.

### Quy tắc output file
- Chỉ ghi output vào `.ai/runs/_current/10_plan.md` (hoặc `10_plan_v{N}.md`) và `.ai/runs/_current/11_plan_slices/` (sau khi chốt); cập nhật `.ai/runs/_current/00_requirements_log.md` khi cần. Không tạo report ở nơi khác.
- Viết bằng tiếng Việt có dấu.
- Nếu cần bảng: dùng fixed-width table trong code block (không dùng bảng markdown với dấu `|`).
- Khi cần hỏi thêm, vẫn phải đưa 1–3 phương án kèm tradeoff và đề xuất 1 phương án phù hợp nhất.
- Sau khi người dùng xác nhận lựa chọn, cập nhật lại plan hiện tại để phản ánh trạng thái đã chốt và chỉ giữ approach đã chọn (loại bỏ option khác).
- Sau khi đã chia slice, yêu cầu người dùng chốt plan chính. Chỉ sau khi chốt mới tạo file plan riêng cho từng slice.
- Nếu cần xác nhận việc tạo file slice, hỏi user trước khi tạo.
- Khi làm/chốt plan từng slice, nếu cần cập nhật master plan thì cập nhật lại plan hiện tại.
- Khi đề xuất lệnh verification/test/build, ưu tiên chạy qua container Docker theo cấu hình của project (nếu chưa rõ, hỏi đường dẫn compose).
- Nếu đề xuất trong nhật ký đã được xử lý trong plan hiện tại, đánh dấu DONE hoặc gỡ khỏi nhật ký để gọn (ghi ngày/giờ).
- Luôn đánh giá độ phức tạp và chủ động chia slice trong plan nếu:
  - Nhiều layer (UI + API + DB + auth)
  - Nhiều file thay đổi
  - Có log test/build dài hoặc rủi ro cao
- Trước khi chuyển sang /implement: yêu cầu xác nhận scope/approach và xác nhận slice plan (để khóa phạm vi).

## Đầu vào bắt buộc phải đọc (theo thứ tự ưu tiên)
1) `AGENTS.md`
2) `.codex/project-profile.md` (nếu có)
3) `.ai/runs/_current/00_ba.md` (nếu có)
4) `.ai/runs/_current/00_requirements_log.md` (nếu có)
5) Repo-index / repo map (nếu có):
   - `.ai/runs/persist/00_repo_map_overview.md`
   - `.ai/runs/persist/01_repo_map_features/` (các file liên quan)
6) `.ai/runs/_current/18_research_summary.md` (nếu có)
7) Input người dùng (TASK)

## Nguyên tắc “Slice-first”
- Plan phải đề xuất chia slice dựa trên BA:
  - Mỗi slice là một “vertical slice” có thể kiểm chứng (UI→API→DB→test cho 1 luồng).
  - Ưu tiên slice theo “happy path trước”, edge cases sau.
- Mỗi slice phải có:
  - Goal (1–2 dòng)
  - Deliverables (UI/API/DB/tests)
  - Files likely touched (ước lượng)
  - Definition of Done (DoD) testable
  - Verification commands (ưu tiên chạy được trong docker/local theo project)
  - Checkpoint point (khuyến nghị reset chat sau slice pass)
- Không nhồi mọi thứ vào 1 lần implement.

## Cấu trúc output bắt buộc: `.ai/runs/_current/10_plan.md`

### 0) Header
- Tên feature
- Ngày/phiên bản plan (nếu chạy lại plan, ghi “rev” và thay đổi chính)

### 1) Goal (2–3 dòng)

### 2) Scope
- In-scope
- Out-of-scope (nhắc lại từ BA, có thể bổ sung để chống scope creep)

### 3) Constraints & Assumptions
- Constraints kỹ thuật (auth pattern, DB, framework, docker)
- Assumptions (tối đa 5)
- Questions (tối đa 3 — chỉ hỏi khi bắt buộc để tránh làm sai)

### 4) Options + Tradeoffs
- Options (A/B/C) ngắn gọn
- Tradeoffs (maintainability, speed, risk)
- Recommended approach (chọn 1) + lý do
- Nếu user đã chốt approach trước đó: bỏ options, chỉ giữ approach đã chốt.

### 5) Slice Plan (BẮT BUỘC nếu feature có >1 luồng hoặc nhiều layer)
Mục tiêu: đề xuất chia slice tối ưu dựa trên BA.

Ghi theo định dạng fixed-width table trong code block:

```
SLICE  GOAL (1-2 dòng)                  DELIVERABLES                     DoD (testable)                 VERIFY (lệnh)                     CHECKPOINT

---

S1     ...                               UI/API/DB/Tests                  ...                             ...                                Sau khi pass
S2     ...                               ...                               ...                             ...                                Sau khi pass
S3     ...                               ...                               ...                             ...                                Sau khi pass

```

Nguyên tắc đề xuất slice:
- S1: “đường xương sống” (list/read/happy path) để validate approach
- S2: create + validation + basic tests
- S3: edit + validation + tests
- S4: actions phụ (reset password, audit log, import/export...) + tests
(Tùy BA mà tự điều chỉnh)

### 6) Detailed Implementation Checklist (theo slice)
- Mỗi slice có checklist 6–12 bước (không gộp tất cả vào 1 list dài).
- Mỗi bước nêu rõ “file/module dự kiến” theo pattern repo hiện có.
- Với migration/API/auth/UI, ghi rõ thứ tự ưu tiên.

Ví dụ format:
- Slice S1
  - [ ] ...
  - [ ] ...
- Slice S2
  - [ ] ...
  - [ ] ...

### 7) Data & Migration Plan (nếu có)
- Schema changes
- Migration script naming convention
- Cách chạy migration (docker/local)
- Rollback notes tối thiểu

### 8) Verification Plan (BẮT BUỘC)
- Automated
  - unit/integration tests liên quan
  - typecheck
  - lint
- Manual verification checklist (ngắn, theo slice)
- Chỉ rõ “prefix docker compose” nếu dự án chạy trong docker
- Nếu chưa rõ docker compose path: hỏi đúng 1 câu hoặc nêu assumption + nơi cần user cung cấp

### 9) Risks & Mitigations
- Rủi ro theo slice (auth, data integrity, performance)
- Mitigation cụ thể (feature flag, rollback, small diffs)

### 10) Execution Guidance (để chống full context)
- Khuyến nghị thực thi:
  - Implement theo từng slice
  - Sau mỗi slice PASS verify → tạo checkpoint → chat mới
- Quy định “Không paste log dài vào chat; ghi vào file test step”
- Khi context dài: chạy /checkpoint (nếu có) hoặc tạo checkpoint ngắn trong implement notes

### 11) Next Action / Confirmation
- Yêu cầu user xác nhận:
  - scope/approach
  - slice plan (S1..Sn)
- Chốt plan chính (master plan) trước khi tạo file slice.
- Sau khi xác nhận: plan được coi là “locked”.

## 🧠 Deep Thinking Checklist (BẮT BUỘC trước khi chốt Plan)
Mục đích: Ép tư duy sâu về kỹ thuật, tránh plan nông — phải trả lời TẤT CẢ trước khi chốt.

### A) Phản biện kỹ thuật (Technical Devil's Advocate) — tối thiểu 3 câu:
1. "Approach đã chọn có điểm yếu gì? Nếu gặp vấn đề X (performance/scale/concurrency), approach này xử lý được không?"
2. "Có approach nào ĐƠN GIẢN HƠN mà vẫn đạt yêu cầu không? Mình có đang over-engineer không?"
3. "Nếu chỉ implement slice S1 rồi dừng (MVP), hệ thống có ổn không? Slice nào THẬT SỰ critical?"

### B) Dependency & Integration check:
- [ ] Các slice có dependency lẫn nhau rõ chưa? Có slice nào phải làm trước?
- [ ] Shared components/utilities cần tạo/sửa có ảnh hưởng slice khác không?
- [ ] Migration có backward compatible không? Nếu rollback, data có bị mất?
- [ ] API contract có ổn định? Client cũ có bị break không?

### C) Complexity & Risk calibration:
- [ ] Mỗi slice có thực sự "vertical" (UI→API→DB) hay đang chồng chéo?
- [ ] Có slice nào quá lớn (>12 bước) cần chia nhỏ hơn?
- [ ] Có slice nào có rủi ro cao nhưng chưa có mitigation rõ?
- [ ] Verification commands có chạy được thực tế không (docker, env)?

### D) Đề xuất chủ động (Proactive proposals) — tối thiểu 1:
- Đưa ra ít nhất 1 cải thiện mà user CHƯA yêu cầu nhưng nên có (VD: thêm index DB, caching, error boundary, retry logic).
- Ghi rõ: "Đề xuất bổ sung (không bắt buộc)" để user quyết định.

### E) Kiểm tra sự nhất quán với BA:
- [ ] Tất cả Must requirements trong BA đã có slice tương ứng?
- [ ] Out-of-scope trong BA có bị lọt vào plan không?
- [ ] Acceptance Criteria trong BA có map được sang DoD của slice không?

Kết quả Deep Thinking phải được ghi vào section riêng trong Plan output (section 12).

## File plan riêng theo slice (sau khi chốt master plan)
Sau khi user chốt master plan, tạo file cho từng slice tại:
`.ai/runs/_current/11_plan_slices/S1.md`, `S2.md`, ...

Mỗi file slice gồm:
- **Tài liệu tham chiếu bắt buộc** (đặt ở đầu file; ghi đủ path, nêu "(nếu có)" khi cần):
  - `AGENTS.md`
  - `.codex/project-profile.md`
  - `.ai/runs/persist/00_repo_map_overview.md`
  - `.ai/runs/persist/01_repo_map_features/<feature-slug>.md` (liệt kê file liên quan)
  - `.ai/runs/_current/00_ba.md` + các `00_ba_v*_addendum.md` (nếu có)
  - `.ai/runs/_current/10_plan.md` + các `10_plan_v*.md` (nếu có)
  - `.ai/runs/_current/20_implement.md`
  - `.ai/runs/_current/11_plan_slices/<các slice đã thực hiện>.md`
  - `.ai/runs/_current/40_review.md` (nếu có)
- Goal & phạm vi slice
- Checklist chi tiết (6–12 bước)
- Files/modules dự kiến
- DoD testable
- Verification commands
- Risks riêng của slice

---

## ⚠️ CHECKPOINT CUỐI: requirements_log & recommendations_log (BẮT BUỘC)
Trước khi kết thúc phiên Plan, PHẢI thực hiện:
1. **Review lại `00_requirements_log.md`**: Có thông tin nào phát sinh trong quá trình plan chưa được ghi không? Nếu có → append ngay.
2. **Review `00_recommendations_log.md`**: Nếu plan phát sinh đề xuất nào nằm ngoài scope hiện tại → ghi vào recommendations_log với status TODO.
3. Xác nhận đã hoàn thành 2 bước trên trước khi báo cáo kết quả cho user.
