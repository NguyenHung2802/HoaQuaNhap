---
name: cursor-ba
description: BA/Business Analysis cho Antigravity. Dùng khi người dùng cần làm rõ yêu cầu tính năng/UI, đối chiếu code hiện có, chốt scope và phương án triển khai.
---

# Workflow BA (SAFE, code-informed)

## Mục tiêu
Tạo tài liệu BA tốt nhất từ yêu cầu tính năng + giao diện, dựa trên codebase hiện có, để bước sau (plan/implement/test/review) có thể triển khai chính xác, ít hỏi lại, ít hallucinate.

Dùng khi người dùng cần làm rõ yêu cầu tính năng/UI, đối chiếu code hiện có, chốt scope và phương án triển khai. Output: .ai/runs/_current/00_ba.md và nhật ký yêu cầu gốc .ai/runs/_current/00_requirements_log.md (không tạo file rác khác, không tạo ra bất kỳ artifact nào khác).

## Guardrails (BẮT BUỘC)
- Đọc `README.md` và thư mục `docs/` của dự án **WebHoaQua** trước khi bắt đầu.
- Nếu có `.codex/project-profile.md` ở root repo: đọc và ưu tiên áp dụng.
- Nếu repo chưa "được index/scan" trong phiên làm việc hiện tại: thực hiện bước repo-index trước khi viết BA (chỉ phân tích, không sửa code).
- Luôn đọc `.ai/runs/persist/00_recommendations_log.md` để cân nhắc đề xuất liên quan.
  - Nếu file chưa tồn tại, tạo file mới theo template header sau để đồng bộ giữa các task:
    - Header (text thường):
      - `# NHẬT KÝ ĐỀ XUẤT`
      - `- Ngày tạo: YYYY-MM-DD`
      - `- Định dạng: bảng fixed-width trong code block (không dùng bảng markdown)`
    - Table header (code block):
      ```
      TYPE        STATUS   NGÀY        BỐI CẢNH                  MÔ TẢ
      ----------  -------  ----------  ------------------------  ----------------------------------------
      ```
- Không viết code trong bước BA.

### ⚠️ QUY TẮC VERSIONING (QUAN TRỌNG — KHÔNG GHI ĐÈ)
- **Lần đầu** chạy `/ba` cho feature hiện tại → tạo `00_ba.md`.
- **Các lần sau** (sau review, sau phát sinh bổ sung, sau khi scope thay đổi):
  - KHÔNG ghi đè `00_ba.md` gốc.
  - Tạo file addendum mới: `00_ba_v{N}_addendum.md` (N tăng dần, bắt đầu từ 2).
  - Tự detect số version tiếp theo bằng cách đếm file `00_ba_v*` có trong `.ai/runs/_current/`.
  - File addendum phải:
    - Tham chiếu `00_ba.md` gốc ở đầu file.
    - Ghi rõ ngày/giờ tạo addendum.
    - Chỉ ghi **phần thay đổi/bổ sung**, không copy lại toàn bộ BA cũ.
    - Nếu có mục nào bị thay thế hoặc loại bỏ so với BA gốc, ghi rõ: "Thay thế mục X trong 00_ba.md".
  - Cấu trúc addendum:
    ```
    # BA Addendum v{N} — [Tên feature]
    - Ngày: YYYY-MM-DD HH:mm
    - Tham chiếu: 00_ba.md (và các addendum trước nếu có)
    - Lý do bổ sung: [tóm tắt ngắn — VD: phát sinh từ review, user bổ sung yêu cầu mới]

    ## Bổ sung / Thay đổi
    [Nội dung bổ sung theo cấu trúc BA gốc, chỉ ghi mục mới/sửa]

    ## Tác động đến Plan/Slice hiện có
    [Liệt kê slice nào bị ảnh hưởng, nếu có]
    ```
- **File slice plan hiện có** (`11_plan_slices/S*.md`): KHÔNG ghi đè trừ khi chính slice đó có bổ sung từ BA addendum mới.
- **File report** (`20_implement.md`, `30_test.md`, `40_review.md`): KHÔNG ghi đè — chỉ append section mới.

### Quy tắc output file
- Không tạo bất kỳ file report nào ngoài: `.ai/runs/_current/00_ba.md` (hoặc `00_ba_v{N}_addendum.md`) và `.ai/runs/_current/00_requirements_log.md`.
  - TUYỆT ĐỐI không tạo các file như `CODE_REVIEW.md`, `TEST_RESULTS.md`, `REVIEW_SUMMARY.md` ở root/src.
- Tạo và cập nhật nhật ký yêu cầu gốc tại `.ai/runs/_current/00_requirements_log.md`:
  - Ghi toàn bộ yêu cầu gốc do người dùng cung cấp (ưu tiên nguyên văn).
  - Mọi bổ sung/điều chỉnh trong quá trình chat phải được append với ngày/giờ.
  - Nếu có nội dung bị loại bỏ, ghi rõ mục đã bỏ + lý do + ngày/giờ.
- Output bắt buộc bằng tiếng Việt có dấu.
- Nếu cần bảng: dùng bảng fixed-width trong code block (không dùng bảng markdown với dấu `|`).
- Nếu có nhiều phương án, phải đề xuất 1 phương án khuyến nghị.
- Sau khi người dùng xác nhận phương án, cập nhật lại report:
  - GIỮ DUY NHẤT phương án đã chọn
  - Loại bỏ các phương án còn lại để tài liệu nhất quán.
- Khi đề cập lệnh kiểm thử/triển khai, ưu tiên chạy qua container Docker theo cấu hình của project (nếu chưa rõ, hỏi đường dẫn compose).
- Nếu đề xuất trong nhật ký đã được xử lý trong BA hiện tại, đánh dấu DONE hoặc gỡ khỏi nhật ký để gọn (ghi ngày/giờ).

## Quy trình (Chuẩn SAFE)
1) Thu thập bối cảnh/mục tiêu/đối tượng dùng và ràng buộc.
2) Đọc codebase để xác định:
   - module liên quan
   - luồng dữ liệu hiện trạng
   - điểm tích hợp
   - hạn chế kỹ thuật (auth, permissions, DB, API patterns, UI framework, conventions)
3) Gap analysis: yêu cầu mới vs hiện trạng.
4) Đề xuất phạm vi theo 3 mức: Cơ bản / Chuẩn / Đầy đủ (MVP → Full).
5) Chốt lựa chọn khuyến nghị + tradeoff.
6) Đặc tả chi tiết:
   - chức năng, phi chức năng
   - data model / API contract
   - states, permissions, error handling
   - acceptance criteria testable
7) Đưa ra “Definition of Ready” để AI bước sau lên plan/code không mơ hồ.
8) **Chạy Deep Thinking Checklist** (xem bên dưới) trước khi chốt BA.

## 🧠 Deep Thinking Checklist (BẮT BUỘC trước khi chốt BA)
Mục đích: Ép tư duy sâu, tránh phân tích nông — phải trả lời TẤT CẢ trước khi chốt.

### A) Phản biện (Devil's Advocate) — tối thiểu 3 câu hỏi tự đặt:
1. "Nếu tính năng này chạy 6 tháng tới với dữ liệu gấp 10 lần, điều gì sẽ hỏng?"
2. "User có thể dùng tính năng này SAI cách nào? (misuse / abuse / edge case)"
3. "Nếu bỏ 1 yêu cầu Must, hệ thống có còn hoạt động đúng không? Yêu cầu nào là thực sự thiết yếu?"

### B) Kiểm tra chiều sâu (Second-order effects):
- [ ] Tính năng mới có ảnh hưởng đến module/feature nào khác NGOÀI scope?
- [ ] Có data migration nào cần rollback plan không?
- [ ] Có dependency ngầm nào (API bên thứ 3, queue, cron job, cache) chưa tính?
- [ ] Permission/role model hiện có có đủ cho tính năng mới không, hay cần mở rộng?
- [ ] Nếu tính năng dùng concurrent access (nhiều user cùng lúc), có race condition không?

### C) So sánh với hiện trạng (Consistency check):
- [ ] Pattern code mới có NHẤT QUÁN với pattern hiện có trong repo không?
- [ ] Cách đặt tên API/routes/components có theo convention hiện tại không?
- [ ] Error handling có dùng cùng pattern với các module tương tự không?
- [ ] UI/UX có consistent với các màn hình hiện có không (spacing, button style, form pattern)?

### D) Đề xuất chủ động (Proactive proposals) — tối thiểu 1:
- Đưa ra ít nhất 1 đề xuất bổ sung mà user CHƯA yêu cầu nhưng sẽ có lợi (VD: thêm audit log, thêm validation, thêm loading state, tối ưu query).
- Ghi rõ: "Đề xuất bổ sung (không bắt buộc)" để user quyết định.

### E) Kiểm tra rủi ro triển khai:
- [ ] Có cần feature flag / kill switch không?
- [ ] Nếu deploy lỗi, rollback strategy là gì?
- [ ] Có cần blue-green / canary deployment không?

Kết quả Deep Thinking phải được ghi vào section riêng trong BA output (section 20).

## Cách xử lý khi yêu cầu chưa đủ rõ
- Ưu tiên đưa ra “Assumptions” rõ ràng (tối đa 5).
- Chỉ hỏi “Questions” khi thật sự cần để tránh làm sai (tối đa 3).
- Nếu UI/mockup chưa đủ, mô tả UI theo thành phần và hành vi (UX behavior) thay vì đoán UI mới.

## Nhật ký yêu cầu gốc (BẮT BUỘC)
File: `.ai/runs/_current/00_requirements_log.md`

Cấu trúc gợi ý:
- Header: Tên feature + ngày tạo
- Mục “Yêu cầu gốc” (nguyên văn)
- Mục “Cập nhật/Điều chỉnh” (append theo thời gian, có ngày/giờ)
- Mục “Loại bỏ” (nếu có, ghi rõ nội dung bị bỏ + lý do + ngày/giờ)

## Output bắt buộc
Chỉ ghi vào:
- `.ai/runs/_current/00_ba.md` (lần đầu) hoặc `00_ba_v{N}_addendum.md` (các lần sau)
- `.ai/runs/_current/00_requirements_log.md`

Nội dung BA phải theo cấu trúc dưới đây (đủ mục; nếu không áp dụng thì ghi “N/A” + lý do):

1) TÓM TẮT 1 TRANG (Executive Summary)
- Mục tiêu
- Phạm vi In/Out
- Phương án khuyến nghị
- Rủi ro lớn nhất + cách giảm rủi ro
- Tiêu chí nghiệm thu quan trọng nhất

2) BỐI CẢNH & MỤC TIÊU
- Bối cảnh vận hành (ai dùng, tần suất, quy trình)
- Mục tiêu kinh doanh (đo được)
- Stakeholders (nếu biết)
- Ràng buộc (thời gian, nguồn lực, tech, compliance)

3) HIỆN TRẠNG TỪ CODEBASE
- Module/feature hiện có liên quan (liệt kê file/module chính nếu tìm được)
- Luồng hiện trạng (tóm tắt)
- Vấn đề chính/điểm đau
- Constraints kỹ thuật (auth/roles, DB schema, API conventions, UI components patterns)

4) PERSONAS / USER JOURNEYS (nếu phù hợp)
- Persona chính
- Mục tiêu và pain points
- Journey ngắn (as-is / to-be)

5) SCREEN FLOW & USER FLOW (Mermaid, tiếng Việt có dấu)
- As-is (nếu có)
- To-be (giải pháp mới)
Yêu cầu:
- Mermaid rõ ràng, đặt tên node dễ hiểu.
- Nếu không có as-is thì ghi N/A.

6) PHẠM VI (Scope)
- In-scope
- Out-of-scope (ghi rõ những thứ “không làm” để tránh scope creep)

7) YÊU CẦU CHỨC NĂNG (FR)
- Viết theo MoSCoW: Must / Should / Could / Won’t
- Mỗi requirement phải có:
  - mô tả
  - actor/role
  - trigger
  - kết quả mong đợi
  - dữ liệu liên quan

8) YÊU CẦU PHI CHỨC NĂNG (NFR)
- Hiệu năng (SLA/SLO nếu có)
- Bảo mật (roles, permission checks, audit log)
- Khả dụng/khôi phục
- Quan sát (logging/metrics/tracing)
- Tương thích ngược (nếu có API/DB thay đổi)

9) QUYỀN & TRẠNG THÁI (Permissions & States)  **(BẮT BUỘC nếu có CRUD/quản trị)**
- Roles liên quan + quyền
- Entity states (active/inactive/draft/locked…)
- Hành vi theo state (what allowed/blocked)

10) MÔ HÌNH DỮ LIỆU / LƯỢC ĐỒ (Data Model)
- Entity chính + thuộc tính
- Unique constraints, indexes
- Migration plan sơ bộ + rollback note
- Nếu có liên kết với bảng hiện tại: mô tả mapping

11) API CONTRACT / INTEGRATIONS (nếu có)
- Endpoints dự kiến theo chuẩn dự án hiện có
- Params, request/response schema (ngắn gọn nhưng rõ)
- Error codes/validation rules
- Integrations (email, queue, third-party, webhooks…) nếu có

12) UI/UX BEHAVIOR (rất quan trọng khi có mockup)
- Danh sách màn hình / components
- Hành vi tìm kiếm/filter/sort/pagination
- Form validation & error messages
- Loading/empty/error states
- Accessibility/basic UX notes (nếu phù hợp)
Lưu ý:
- Không chèn link ảnh local path kiểu /Users/...; nếu có mockup ảnh, chỉ mô tả bằng text.

13) EDGE CASES & FAILURE MODES
- Các case dễ lỗi (race condition, duplicate submit, conflict update, permission mismatch, invalid state)
- Cách xử lý (block/rollback/retry)

14) TIÊU CHÍ NGHIỆM THU (Acceptance Criteria) + CHỈ SỐ ĐO LƯỜNG
- AC phải testable (Given/When/Then hoặc bullet rõ điều kiện)
- KPI/metrics thành công (nếu có)
- Telemetry events (nếu cần đo)

15) PHƯƠNG ÁN TRIỂN KHAI (Cơ bản / Chuẩn / Đầy đủ) + TRADEOFFS
- Mỗi phương án ghi:
  - scope
  - effort tương đối
  - rủi ro
  - dependencies
- Chọn 1 phương án khuyến nghị và lý do.
- Sau khi user xác nhận: chỉ giữ phương án đã chọn.

16) RỦI RO / PHỤ THUỘC
- Technical risks
- Product risks
- Dependencies (team khác, dữ liệu, API, hạ tầng)

17) DECISION LOG (Nhật ký quyết định)
- Ghi các quyết định quan trọng + lý do
- Ghi rõ những điểm “đã chốt” để /plan và /implement bám theo

18) ASSUMPTIONS + QUESTIONS
- Assumptions: tối đa 5
- Questions: tối đa 3 (chỉ hỏi khi bắt buộc)

19) DEFINITION OF READY (DoR) cho bước /plan
Liệt kê rõ để bước sau không bị thiếu:
- Đã chốt phương án nào
- Đã có danh sách màn hình/fields/API hay chưa
- Đã rõ rule permission/state chưa
- Đã rõ verification commands (test/lint/build) chưa
- Những thông tin còn thiếu nhưng đã có assumptions thay thế

20) DEEP THINKING RESULTS (từ checklist ở trên)
- Kết quả phản biện (Devil's Advocate) — 3 câu hỏi + trả lời
- Second-order effects đã kiểm tra
- Consistency check results
- Đề xuất chủ động (Proactive proposals)
- Rủi ro triển khai đã cân nhắc

---

## ⚠️ CHECKPOINT CUỐI: requirements_log & recommendations_log (BẮT BUỘC)
Trước khi kết thúc phiên BA, PHẢI thực hiện:
1. **Review lại `00_requirements_log.md`**: Có thông tin nào phát sinh trong quá trình BA chưa được ghi không? Nếu có → append ngay.
2. **Review `00_recommendations_log.md`**: Nếu BA phát sinh đề xuất nào chưa nằm trong scope hiện tại → ghi vào recommendations_log với status TODO.
3. Xác nhận đã hoàn thành 2 bước trên trước khi báo cáo kết quả cho user.
