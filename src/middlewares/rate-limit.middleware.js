/**
 * Giới hạn tốc độ trong bộ nhớ (phù hợp 1 tiến trình PM2, không cần Redis).
 */
function createCounter({ windowMs, max }) {
    const hits = new Map();
    const timer = setInterval(() => {
        const now = Date.now();
        for (const [k, v] of hits) if (v.reset <= now) hits.delete(k);
    }, Math.max(windowMs, 30000));
    if (timer.unref) timer.unref();

    return {
        /** Tăng bộ đếm; trả về {limited, retryAfter}. */
        hit(key) {
            const now = Date.now();
            let e = hits.get(key);
            if (!e || e.reset <= now) {
                e = { count: 0, reset: now + windowMs };
                hits.set(key, e);
            }
            e.count++;
            return { limited: e.count > max, retryAfter: Math.ceil((e.reset - now) / 1000) };
        },
        /** Chỉ kiểm tra, không tăng. */
        peek(key) {
            const e = hits.get(key);
            if (!e || e.reset <= Date.now()) return { limited: false, retryAfter: 0 };
            return { limited: e.count >= max, retryAfter: Math.ceil((e.reset - Date.now()) / 1000) };
        },
        /** Xóa bộ đếm của một khóa (vd sau khi đăng nhập thành công, không phạt oan lần gõ sai trước đó). */
        release(key) { hits.delete(key); },
        size: () => hits.size
    };
}

/** Middleware Express: keyFn(req) -> chuỗi khóa; vượt ngưỡng trả 429 JSON. */
function rateLimit({ windowMs, max, keyFn, message }) {
    const counter = createCounter({ windowMs, max });
    return (req, res, next) => {
        const r = counter.hit(keyFn(req));
        if (r.limited) {
            res.set('Retry-After', String(r.retryAfter));
            return res.status(429).json({ error: { code: 'rate_limited', message: message || 'Quá nhiều yêu cầu, vui lòng thử lại sau.' } });
        }
        next();
    };
}

module.exports = { createCounter, rateLimit };
