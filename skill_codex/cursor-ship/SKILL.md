---
name: cursor-ship
description: "Orchestrator end-to-end cho Cursor Chat với ChatGPT Codex extension. Dùng khi người dùng yêu cầu /ship hoặc muốn chạy đầy đủ flow: /ba, /research, /ba (chốt), /plan (chốt), /implement, /test, /review, /docs, /git, /project và tạo .ai/runs/_current/90_ship_summary.md."
---

# Cursor Ship

## Tổng quan

Chạy toàn bộ quy trình theo thứ tự và tạo ship summary cuối.

## Quy trình

- Đọc AGENTS.md trước khi bắt đầu.
- Nếu có file cấu hình theo project, ưu tiên đọc: `.codex/project-profile.md` ở root repo hiện tại.
- Trước khi chạy /ba và /research, đảm bảo repo-index đã được chạy; nếu chưa có, chạy repo-index trước.
- Nếu thiếu thông tin, hỏi tối đa 3 câu và dừng trước /implement.
- Thực hiện theo thứ tự: /ba → /research → /ba (chốt) → /plan (chốt) → /implement → /test → /review → /docs → /git → /project.
- Đảm bảo toàn bộ tài liệu chỉ ghi vào .ai/runs/_current/.
- Viết toàn bộ nội dung output bằng tiếng Việt có dấu.
- Nếu có bảng trong báo cáo, canh cột thẳng hàng bằng ký tự fixed width (ưu tiên bảng trong code block), không dùng bảng markdown dạng dấu `|`.
- Khi cần hỏi thêm, luôn đưa 1–3 phương án kèm tradeoff và đề xuất phương án phù hợp nhất để người dùng chọn.
- Sau khi người dùng xác nhận lựa chọn, cập nhật lại report ở bước hiện tại để phản ánh trạng thái đã được xác nhận.
- Sau khi chốt, chỉ giữ lại phương án/hướng/approach đã chọn trong report; loại bỏ các lựa chọn khác để đảm bảo nhất quán.
- Sau /review, ghi .ai/runs/_current/90_ship_summary.md theo format:
  - Goal
  - BA option chosen
  - Research summary
  - Approach chosen
  - Files changed
  - Test commands + final status
  - Review outcome (must fix? resolved?)
  - Docs updated
  - Commit/PR draft
  - Roadmap/changelog updates
  - Manual verification steps
  - Suggested commit message
  - Rollback notes
