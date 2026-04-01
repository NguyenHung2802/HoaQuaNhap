---
name: repo-index
description: "Lập repo map trước khi /plan, /implement, /review để hiểu rõ codebase. Dùng khi cần index repo, tạo repo map tổng và repo map theo tính năng/nhóm tính năng, cập nhật lại khi phạm vi mở rộng, và lưu output vào .ai/runs/persist/."
---

# Repo Index

## Tổng quan

Bắt buộc lập repo map trước các bước /plan, /implement, /review để đảm bảo hiểu đúng codebase.

## Quy trình

- Đọc AGENTS.md ở root repo trước khi bắt đầu.
- Nếu có file cấu hình theo project, ưu tiên đọc: `.codex/project-profile.md` ở root repo hiện tại.
- Luôn chạy repo index trước /plan, /implement, /review.
- Đảm bảo thư mục `.ai/runs/persist` tồn tại; nếu chưa có thì tạo.
- Viết toàn bộ nội dung output bằng tiếng Việt có dấu.
- Nếu có bảng trong báo cáo, canh cột thẳng hàng bằng ký tự fixed width (ưu tiên bảng trong code block), không dùng bảng markdown dạng dấu `|`.
- Nếu chưa rõ format hoặc nơi lưu, hỏi người dùng và đề xuất phương án mặc định.
- Sau khi người dùng xác nhận lựa chọn, cập nhật lại report ở bước hiện tại để phản ánh trạng thái đã được xác nhận.

## Output bắt buộc

- Repo map tổng: mặc định ghi vào `.ai/runs/persist/00_repo_map_overview.md`.
- Repo map theo tính năng/nhóm tính năng: mặc định ghi vào thư mục `.ai/runs/persist/01_repo_map_features/` (mỗi file theo slug của feature).
- Nếu người dùng cung cấp format/đường dẫn khác, ưu tiên theo yêu cầu của người dùng và ghi rõ trong repo map tổng.

## Nội dung repo map tổng (gợi ý cấu trúc)

- Mục tiêu tổng quan và phạm vi index
- Cây thư mục cấp cao (top-level)
- Các module/khu vực chính + mô tả trách nhiệm
- Luồng dữ liệu/chức năng chính (high-level)
- Điểm cấu hình quan trọng (env/config) và entrypoints
- Danh sách repo map theo tính năng (liên kết tới các file map chi tiết)

## Nội dung repo map theo tính năng

- Mục tiêu/tính năng
- File/module liên quan (đường dẫn + vai trò)
- Luồng xử lý chính của tính năng
- Phụ thuộc chính (service, DB, API, config)
- Rủi ro/khu vực nhạy cảm

## Quy tắc cập nhật

- Nếu trong bất kỳ bước nào (plan/implement/review/test) phát hiện phạm vi mở rộng, cập nhật lại repo map tương ứng trước khi tiếp tục.
- Khi thêm phạm vi mới, cập nhật cả repo map tổng và map chi tiết liên quan.
- Ghi ngày/giờ cập nhật cuối ở mỗi repo map để dễ đối chiếu.

## Gợi ý câu hỏi bắt buộc (khi cần)

- Bạn muốn lưu repo map ở đâu? (mặc định: `.ai/runs/persist/`)
- Bạn muốn format repo map theo mẫu nào? (mặc định: các mục gợi ý ở trên)
- Có cần chia map theo feature/nhóm feature cụ thể nào không? Nếu có, liệt kê tên/slug.
