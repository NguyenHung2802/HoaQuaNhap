# BA — Thông báo Đơn Hàng Mới

## 1. Bối cảnh

Hiện tại hệ thống đã có hạ tầng thông báo (Email + Telegram) hoạt động tốt cho module **Liên hệ tư vấn** (contacts). Tuy nhiên khi khách đặt đơn hàng thực tế qua `/checkout/place-order` thì **không có thông báo nào được gửi về cho admin/chủ shop**.

## 2. Yêu cầu người dùng

> "Gửi thông báo và email mỗi khi có đơn hàng mới dựa trên tính năng khách hàng gửi thông tin liên hệ"

**Diễn giải**: Áp dụng cơ chế thông báo tương tự Contact (Email + Telegram) cho sự kiện đặt đơn hàng mới.

## 3. Phạm vi (Scope)

### Must-do
- [x] Tạo hàm `sendOrderNotificationEmail(order)` — gửi email khi có đơn mới
- [x] Tạo hàm `sendOrderTelegramNotification(order)` — bắn Telegram khi có đơn mới
- [x] Tích hợp vào `checkout.controller.js → placeOrder()` sau khi tạo đơn thành công
- [x] Tích hợp vào `orders.controller.js → quickCheckout()` sau khi tạo đơn nhanh thành công
- [x] Email nội dung: Mã đơn, tên KH, SĐT, địa chỉ, sản phẩm, tổng tiền, PTTT
- [x] Telegram nội dung: Cô đọng hơn, emoji, link admin để xem đơn

### Should-do
- [x] Tái sử dụng hạ tầng notification từ `contacts.controller.js` (không viết lại)
- [x] Cập nhật sender name từ "WebHoaQua" → "Hải Anh Fruit"

### Out-of-scope
- Gửi email xác nhận cho khách hàng (mở rộng tương lai)
- SMS notification

## 4. Phân tích kỹ thuật

### Điểm tích hợp:
1. `src/modules/public/checkout/checkout.controller.js` → `placeOrder()`
2. `src/modules/orders/orders.controller.js` → `quickCheckout()`

### Chiến lược:
- Tạo module `src/utils/order-notification.js` dùng chung
- Gọi `Promise.allSettled([email, telegram])` — async, không block response

## 5. Rủi ro
- Nếu email/Telegram lỗi → không ảnh hưởng luồng đặt hàng (đã dùng allSettled)
