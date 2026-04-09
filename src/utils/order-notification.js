/**
 * order-notification.js
 * Utility: Gửi thông báo Email + Telegram khi có đơn hàng mới
 * Tái sử dụng hạ tầng tương tự contacts.controller.js
 */
const nodemailer = require('nodemailer');
const https = require('https');

/**
 * Format tiền VNĐ
 */
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

/**
 * Format phương thức thanh toán
 */
const formatPaymentMethod = (method) => {
    const map = {
        'COD': '💵 Thanh toán khi nhận hàng (COD)',
        'BANK_TRANSFER': '🏦 Chuyển khoản ngân hàng',
    };
    return map[method] || method;
};

/**
 * Gửi email thông báo đơn hàng mới cho admin
 * @param {Object} order - order object với items đã include
 */
const sendOrderNotificationEmail = async (order) => {
    try {
        const mailUser = process.env.MAIL_USER;
        const mailPass = process.env.MAIL_PASS;

        console.log(`[Email] Bắt đầu gửi email cho đơn #${order.order_code}, mail: ${mailUser}`);

        if (!mailUser || !mailPass) {
            console.log('[Email] Chưa cấu hình MAIL_USER/MAIL_PASS, bỏ qua.');
            return;
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: mailUser, pass: mailPass }
        });

        // Hỗ trợ cả hai tên trường khác nhau
        const address = order.shipping_address || order.delivery_address || 'Chưa có';
        const customerName = order.customer_name || order.receiver_name || 'Khách hàng';
        const customerPhone = order.customer_phone || order.receiver_phone || '';

        const itemsHtml = (order.items || []).map(item => {
            const name = item.product_name_snapshot || item.product_name || 'Sản phẩm';
            const price = parseFloat(item.price_snapshot || item.unit_price || 0);
            return `
            <tr>
                <td style="padding:8px;border-bottom:1px solid #eee">${name}</td>
                <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
                <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${formatCurrency(price)}</td>
                <td style="padding:8px;border-bottom:1px solid #eee;text-align:right"><strong>${formatCurrency(item.quantity * price)}</strong></td>
            </tr>
            `;
        }).join('');

        const mailOptions = {
            from: `"Hải Anh Fruit" <${mailUser}>`,
            to: mailUser,
            subject: `🛒 [Hải Anh Fruit] Đơn hàng mới #${order.order_code} — ${customerName}`,
            html: `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;padding:20px">
                    <div style="background:#2e7d32;color:white;padding:20px;border-radius:8px 8px 0 0;text-align:center">
                        <h2 style="margin:0">🎉 Đơn Hàng Mới!</h2>
                        <p style="margin:8px 0 0">Mã đơn: <strong>#${order.order_code}</strong></p>
                    </div>
                    
                    <div style="background:white;padding:24px;border-radius:0 0 8px 8px;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
                        <h3 style="color:#2e7d32;border-bottom:2px solid #e8f5e9;padding-bottom:8px">📋 Thông tin khách hàng</h3>
                        <table style="width:100%;border-collapse:collapse">
                            <tr><td style="padding:6px 0;color:#666;width:140px">Họ tên:</td><td><strong>${customerName}</strong></td></tr>
                            <tr><td style="padding:6px 0;color:#666">Số điện thoại:</td><td><strong><a href="tel:${customerPhone}">${customerPhone}</a></strong></td></tr>
                            ${order.customer_email ? `<tr><td style="padding:6px 0;color:#666">Email:</td><td>${order.customer_email}</td></tr>` : ''}
                            <tr><td style="padding:6px 0;color:#666">Địa chỉ:</td><td>${address}</td></tr>
                            <tr><td style="padding:6px 0;color:#666">Ghi chú:</td><td>${order.note || 'Không có'}</td></tr>
                        </table>

                        <h3 style="color:#2e7d32;border-bottom:2px solid #e8f5e9;padding-bottom:8px;margin-top:24px">🛍 Sản phẩm đặt mua</h3>
                        <table style="width:100%;border-collapse:collapse">
                            <thead><tr style="background:#e8f5e9">
                                <th style="padding:10px;text-align:left">Sản phẩm</th>
                                <th style="padding:10px;text-align:center">SL</th>
                                <th style="padding:10px;text-align:right">Đơn giá</th>
                                <th style="padding:10px;text-align:right">Thành tiền</th>
                            </tr></thead>
                            <tbody>${itemsHtml || '<tr><td colspan="4" style="padding:8px;color:#999">Không có chi tiết sản phẩm</td></tr>'}</tbody>
                        </table>

                        <div style="margin-top:16px;text-align:right">
                            ${(order.discount_amount > 0) ? `<p style="color:#666;margin:4px 0">Giảm giá: <span style="color:#e53935">-${formatCurrency(order.discount_amount)}</span></p>` : ''}
                            ${(order.shipping_fee > 0) ? `<p style="color:#666;margin:4px 0">Phí vận chuyển: ${formatCurrency(order.shipping_fee)}</p>` : ''}
                            <p style="font-size:1.2em;color:#2e7d32;margin:8px 0"><strong>Tổng cộng: ${formatCurrency(order.total_amount)}</strong></p>
                            <p style="color:#666;margin:4px 0">Thanh toán: ${formatPaymentMethod(order.payment_method)}</p>
                        </div>

                        <div style="margin-top:24px;padding:16px;background:#fff3cd;border-radius:8px;border-left:4px solid #ffc107">
                            <strong>⚡ Hành động cần thực hiện:</strong><br>
                            Gọi xác nhận đơn hàng cho <strong>${customerName}</strong> tại số <strong>${customerPhone}</strong> ngay!
                        </div>
                    </div>
                    <p style="text-align:center;color:#999;font-size:12px;margin-top:16px">
                        Hải Anh Fruit — N05 Ecohome 3, Đông Ngạc, Bắc Từ Liêm, Hà Nội
                    </p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`[Email] ✅ Đã gửi email thông báo đơn #${order.order_code} thành công!`);
    } catch (error) {
        console.error('[Email] ❌ Lỗi gửi email:', error.message);
    }
};

/**
 * Gửi thông báo Telegram khi có đơn hàng mới
 * @param {Object} order - order object với items đã include
 */
const sendOrderTelegramNotification = (order) => {
    return new Promise((resolve) => {
        try {
            const botToken = process.env.TELEGRAM_BOT_TOKEN;
            const chatId = process.env.TELEGRAM_CHAT_ID;

            console.log(`[Telegram] Bắt đầu gửi cho đơn #${order.order_code}, chatId: ${chatId}`);

            if (!botToken || !chatId || botToken.includes('123456789')) {
                console.log('[Telegram] Chưa cấu hình thật, bỏ qua.');
                return resolve();
            }

            const address = order.shipping_address || order.delivery_address || 'Chưa có';
            const customerName = order.customer_name || order.receiver_name || 'Khách hàng';
            const customerPhone = order.customer_phone || order.receiver_phone || '';

            const itemsSummary = (order.items || [])
                .map(i => {
                    const name = i.product_name_snapshot || i.product_name || 'SP';
                    const price = parseFloat(i.price_snapshot || i.unit_price || 0);
                    return `  • ${name} x${i.quantity} — ${formatCurrency(i.quantity * price)}`;
                })
                .join('\n') || '  (Không có chi tiết sản phẩm)';

            const message = [
                '🛒 ĐƠN HÀNG MỚI — HẢI ANH FRUIT',
                '━━━━━━━━━━━━━━━━━━━━',
                `📦 Mã đơn: #${order.order_code}`,
                `👤 Khách: ${customerName}`,
                `📱 SĐT: ${customerPhone}`,
                `🏠 Địa chỉ: ${address}`,
                '',
                '🛍 Sản phẩm:',
                itemsSummary,
                '',
                `💰 Tổng: ${formatCurrency(order.total_amount)}`,
                `💳 PTTT: ${formatPaymentMethod(order.payment_method)}`,
                '',
                '👉 Vào admin xác nhận và xử lý đơn ngay!',
            ].join('\n');

            const payload = JSON.stringify({ chat_id: chatId, text: message });
            const url = new URL(`https://api.telegram.org/bot${botToken}/sendMessage`);
            const options = {
                hostname: url.hostname,
                path: url.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payload)
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    const result = JSON.parse(data);
                    if (result.ok) {
                        console.log(`[Telegram] Đã bắn thông báo đơn #${order.order_code} thành công!`);
                    } else {
                        console.error('[Telegram] API lỗi:', result.description);
                    }
                    resolve();
                });
            });

            req.on('error', (err) => {
                console.error('[Telegram] Lỗi kết nối:', err.message);
                resolve();
            });

            req.write(payload);
            req.end();
        } catch (error) {
            console.error('[Telegram] Lỗi hệ thống:', error);
            resolve();
        }
    });
};

module.exports = {
    sendOrderNotificationEmail,
    sendOrderTelegramNotification
};
