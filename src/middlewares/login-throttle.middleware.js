/**
 * Chặn dò mật khẩu đăng nhập (admin lẫn khách hàng dùng chung /auth/login).
 * Trong bộ nhớ, không cần Redis (giống rate-limit.middleware.js cho API) — đủ dùng cho 1 tiến trình PM2.
 *
 * Hai lớp giới hạn:
 *  - Theo IP: chặn một máy thử nhiều email khác nhau liên tục (quét hàng loạt).
 *  - Theo email: chặn thử nhiều mật khẩu trên một tài khoản cụ thể (kể cả đổi IP/VPN).
 * Đếm theo cửa sổ trượt 15 phút; sau khi đăng nhập đúng thì xóa bộ đếm của email đó
 * để không phạt oan admin chỉ vì gõ sai 1-2 lần trước đó.
 */
const { createCounter } = require('./rate-limit.middleware');

const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_IP = 20;       // một IP được thử tối đa 20 lần / 15 phút (nhiều email khác nhau)
const MAX_PER_EMAIL = 5;     // một email được thử sai tối đa 5 lần / 15 phút

const byIp = createCounter({ windowMs: WINDOW_MS, max: MAX_PER_IP });
const byEmail = createCounter({ windowMs: WINDOW_MS, max: MAX_PER_EMAIL });

const emailKey = (email) => 'em:' + String(email || '').trim().toLowerCase();

/** Đặt trước route POST /login: nếu vượt ngưỡng thì chặn ngay, chưa chạm DB/bcrypt. */
function loginThrottle(req, res, next) {
    const ip = req.ip || 'unknown';
    const email = emailKey(req.body && req.body.email);

    const ipCheck = byIp.peek(ip);
    const emailCheck = email !== 'em:' ? byEmail.peek(email) : { limited: false, retryAfter: 0 };

    if (ipCheck.limited || emailCheck.limited) {
        const retryAfter = Math.max(ipCheck.retryAfter, emailCheck.retryAfter);
        const minutes = Math.max(1, Math.ceil(retryAfter / 60));
        console.warn(`[login-throttle] chặn tạm thời ip=${ip} email=${email} retryAfterSec=${retryAfter}`);
        req.flash('error_msg', `Bạn đã thử đăng nhập sai quá nhiều lần. Vui lòng thử lại sau khoảng ${minutes} phút.`);
        return res.redirect('/auth/login');
    }

    res.locals._loginThrottleIp = ip;
    res.locals._loginThrottleEmail = email;
    next();
}

/** Gọi khi mật khẩu sai hoặc tài khoản không hợp lệ, để tính vào ngưỡng chặn. */
function recordFailedAttempt(req, res) {
    const ip = (res && res.locals._loginThrottleIp) || req.ip || 'unknown';
    const email = (res && res.locals._loginThrottleEmail) || emailKey(req.body && req.body.email);
    byIp.hit(ip);
    if (email !== 'em:') byEmail.hit(email);
}

/** Gọi khi đăng nhập thành công, xóa lịch sử thử sai của email đó (không đụng bộ đếm theo IP). */
function clearAttempts(req, res) {
    const email = (res && res.locals._loginThrottleEmail) || emailKey(req.body && req.body.email);
    if (email !== 'em:') byEmail.release(email);
}

module.exports = { loginThrottle, recordFailedAttempt, clearAttempts };
