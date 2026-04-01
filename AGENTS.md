# AGENTS.md — Hướng dẫn cho AI Assistant

Tài liệu này quy định cách AI (Antigravity) cần tương tác và thực thi các nhiệm vụ trong dự án **WebHoaQua**.

## 1. Nguyên tắc làm việc
- **Document-First**: Luôn đọc `README.md` và các tài liệu trong thư mục `docs/` trước khi bắt đầu bất kỳ nhiệm vụ nào.
- **Strict Workflow**: Tuân thủ quy trình BA -> Plan -> Implement -> Test -> Review.
- **Slice-Aware**: Chia nhỏ công việc thành các slice vertical (UI-API-DB) để tăng độ chính xác.
- **No Overwriting**: Không ghi đè các file log/report hiện có, chỉ append hoặc tạo version mới (`v2`, `v3`).

## 2. Tech Stack Standard
- **Backend**: Node.js v18+, Express.js.
- **Frontend**: EJS (Server-side rendering) + Bootstrap 5.
- **Database**: PostgreSQL + Prisma ORM.
- **Upload**: Cloudinary cho hình ảnh sản phẩm.
- **Convention**: 
    - Module-based: `src/modules/<feature>/`
    - Naming: `kebab-case` cho file, `camelCase` cho biến, `PascalCase` cho class.

## 3. Quy trình thực thi yêu cầu
Mỗi yêu cầu mới của người dùng (TASK) phải được xử lý qua bộ Skill Codex trong thư mục `skill_codex/`.
- **Bước 1**: `/ba` để chốt Business Analysis và Scope.
- **Bước 2**: `/plan` để lên Master Plan và chia Slice.
- **Bước 3**: `/implement` chạy từng Slice.
- **Bước 4**: `/test` kiểm thử logic/UI.
- **Bước 5**: `/review` đánh giá chất lượng và fix lỗi.

## 4. Báo cáo và Nhật ký
- Cập nhật tiến độ vào `docs/04-roadmap-checklist.md`.
- Ghi lại các đề xuất tương lai vào `.ai/runs/persist/00_recommendations_log.md`.
