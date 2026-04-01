# NHẬT KÝ YÊU CẦU GỐC
- **Feature**: Phase 2 — Auth Admin & User Consolidated Login
- **Ngày tạo**: 2026-04-01

## Yêu cầu gốc
- Thực hiện GĐ 2 (Auth Admin) theo tài liệu `docs/phases/02-auth-admin.md`.
- **Đề xuất bổ sung**:
    - Sử dụng chung 1 bảng `User` cho cả Admin và Người dùng, phân biệt bằng cột `role`.
    - Người dùng (Customer) có thể xem SP. Khi muốn mua hàng:
        - Đã đăng nhập: Lưu lịch sử giỏ hàng, đơn hàng.
        - Chưa đăng nhập (Guest): Có thể mua hàng nhưng phải điền đầy đủ Họ tên, SĐT trong form đơn hàng.
        - Cần lưu vết (tracing) thông tin này để liên hệ qua SĐT.
- **Quy trình làm việc**:
    - BA -> Plan -> Slices -> Implement -> Test -> Review (theo AGENTS.md).
