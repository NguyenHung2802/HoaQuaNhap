# Quy trình xử lý yêu cầu (Skill Codex)

Thư mục này chứa các bộ kỹ năng (Skills) hướng dẫn AI cách thực thi các yêu cầu từ người dùng một cách chặt chẽ, từ khâu phân tích đến khi triển khai và kiểm thử.

## 🛠️ Các bước thực hiện tiêu chuẩn

Mỗi yêu cầu tính năng mới nên đi qua các bước sau:

1.  **`/ba` (Business Analysis)**: Phân tích yêu cầu, đối chiếu codebase hiện tại và chốt phạm vi (Scope).
    *   Sử dụng: `skill_codex/cursor-ba/SKILL.md`
2.  **`/plan` (Planning)**: Lên kế hoạch triển khai chi tiết, chia nhỏ thành các "slice" (lát cắt) thực thi.
    *   Sử dụng: `skill_codex/cursor-plan/SKILL.md`
3.  **`/implement` (Implementation)**: Thực hiện viết code theo kế hoạch đã chốt.
    *   Sử dụng: `skill_codex/cursor-implement/SKILL.md`
4.  **`/test` (Testing)**: Kiểm thử các chức năng vừa viết.
    *   Sử dụng: `skill_codex/cursor-test/SKILL.md`
5.  **`/review` (Review)**: Kiểm tra lại chất lượng code và logic.
    *   Sử dụng: `skill_codex/cursor-review/SKILL.md`

## 📂 Quản lý dữ liệu quá trình (Runs)

Tất cả các tài liệu phát sinh trong quá trình xử lý (BA, Plan, Implement log) được lưu trữ tại:
- `.ai/runs/_current/`: Chứa các file của task đang thực hiện.
- `.ai/runs/persist/`: Chứa các log dài hạn (Repo map, Recommendations).

---
> [!IMPORTANT]
> Luôn tham chiếu các file trong thư mục `docs/` để đảm bảo tính nhất quán với kế hoạch tổng thể của dự án WebHoaQua.
