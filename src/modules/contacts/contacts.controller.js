const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const nodemailer = require('nodemailer');
const https = require('https');

/**
 * Send email notification natively using Nodemailer
 */
const sendContactNotificationEmail = async (contact) => {
    try {
        const mailUser = process.env.MAIL_USER;
        const mailPass = process.env.MAIL_PASS;

        if (!mailUser || !mailPass) {
            console.log('Chưa cấu hình MAIL_USER hoặc MAIL_PASS, bỏ qua gửi email.');
            return;
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: mailUser,
                pass: mailPass
            }
        });

        const mailOptions = {
            from: `"WebHoaQua" <${mailUser}>`,
            to: mailUser, // Gửi về chính mình hoặc đổi thành mảng email nhân sự
            subject: `[WebHoaQua] Khách Cần Tư Vấn Gấp: ${contact.phone}`,
            html: `
                <h2>Có khách hàng mới yêu cầu tư vấn!</h2>
                <ul>
                    <li><strong>Tên khách hàng:</strong> ${contact.name}</li>
                    <li><strong>Số điện thoại:</strong> ${contact.phone}</li>
                    <li><strong>Nhu cầu:</strong> ${contact.need}</li>
                    <li><strong>Email:</strong> ${contact.email || 'Không có'}</li>
                    <li><strong>Ghi chú:</strong> ${contact.note || 'Không có'}</li>
                    <li><strong>Nguồn:</strong> <a href="${contact.source_url}">${contact.source_url}</a></li>
                </ul>
                <p>Vui lòng gọi điện lại ngay để chốt đơn nhé!</p>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('Đã gửi email thông báo thành công cho số:', contact.phone);
    } catch (error) {
        console.error('Lỗi khi gửi email thông báo:', error);
    }
};

/**
 * Send notification to Telegram bot
 */
const sendTelegramNotification = (contact) => {
    return new Promise((resolve) => {
        try {
            const botToken = process.env.TELEGRAM_BOT_TOKEN;
            const chatId = process.env.TELEGRAM_CHAT_ID;

            if (!botToken || !chatId || botToken.includes('123456789')) {
                console.log('[Telegram] Chưa cấu hình thật, bỏ qua.');
                return resolve();
            }

            const message = [
                '🛎 CÓ KHÁCH CẦN TƯ VẤN MỚI 🛎',
                '',
                `👤 Tên: ${contact.name}`,
                `📱 SĐT: ${contact.phone}`,
                `🛍 Nhu cầu: ${contact.need}`,
                `📝 Ghi chú: ${contact.note || 'Không có'}`,
                `📧 Email: ${contact.email || 'Không có'}`,
                `🌍 Từ link: ${contact.source_url || 'N/A'}`,
                '',
                '👉 Hãy gọi lại cho khách hàng ngay lúc này!'
            ].join('\n');

            const payload = JSON.stringify({
                chat_id: chatId,
                text: message
            });

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
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    const result = JSON.parse(data);
                    if (result.ok) {
                        console.log('[Telegram] Đã bắn thông báo thành công!');
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

/**
 * [POST] /api/contacts
 * Create a new contact request and trigger notifications
 */
const submitContactForm = async (req, res) => {
    try {
        const { name, phone, need, email, note, source_url } = req.body;

        if (!name || !phone || !need) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập tên, số điện thoại và nhu cầu.' });
        }

        // Lưu vào Database
        const newContact = await prisma.contactRequest.create({
            data: {
                name,
                phone,
                need,
                email: email || null,
                note: note || null,
                source_url: source_url || null,
                status: 'new'
            }
        });

        // Background Tasks: Bắn thông báo không chặn luồng trả về cho khách (Async without await wrap intentionally in flow or promise.all)
        Promise.allSettled([
            sendContactNotificationEmail(newContact),
            sendTelegramNotification(newContact)
        ]);

        return res.json({ 
            success: true, 
            message: 'Đã nhận thông tin. Yêu cầu của bạn đã được chuyển tới chuyên viên!' 
        });
    } catch (error) {
        console.error('Lỗi Submit Contact form:', error);
        return res.status(500).json({ success: false, message: 'Đã có lỗi xảy ra. Hãy thử gọi vào Hotline để được hỗ trợ.' });
    }
};

/**
 * For Admin Page (Later slice)
 */
const renderAdminContacts = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const skip = (page - 1) * limit;

        const [contacts, total] = await Promise.all([
            prisma.contactRequest.findMany({
                orderBy: { created_at: 'desc' },
                skip,
                take: limit
            }),
            prisma.contactRequest.count()
        ]);

        res.render('admin/contacts/index', {
            title: 'Khách hàng Cần Tư Vấn',
            contacts,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            layout: 'layouts/admin'
        });
    } catch (error) {
        next(error);
    }
};

const updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        await prisma.contactRequest.update({
            where: { id: parseInt(id) },
            data: { status }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    submitContactForm,
    renderAdminContacts,
    updateStatus,
    sendContactNotificationEmail,
    sendTelegramNotification
};
