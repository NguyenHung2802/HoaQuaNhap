/**
 * Xác thực API key (Authorization: Bearer <key> hoặc X-API-Key) + chặn dò khóa theo IP.
 */
const { verifyKey, hasScope } = require('../modules/api-keys/api-keys.service');
const newsSettings = require('../modules/settings/news-settings.service');
const { createCounter, rateLimit } = require('./rate-limit.middleware');

const failures = createCounter({ windowMs: 5 * 60 * 1000, max: 10 });

const fail = (res, status, code, message) => res.status(status).json({ error: { code, message } });

function extractKey(req) {
    const auth = req.get('authorization') || '';
    const m = auth.match(/^Bearer\s+(\S+)$/i);
    if (m) return m[1];
    return req.get('x-api-key') || null;
}

function apiKeyAuth(scope = 'posts:write') {
    return async (req, res, next) => {
        try {
            const settings = await newsSettings.get();
            if (!settings.enabled) return fail(res, 503, 'api_disabled', 'API đang tạm tắt.');

            const ip = req.ip || 'unknown';
            const blocked = failures.peek(ip);
            if (blocked.limited) {
                res.set('Retry-After', String(blocked.retryAfter));
                return fail(res, 429, 'too_many_failures', 'Sai khóa quá nhiều lần, thử lại sau.');
            }

            const key = await verifyKey(extractKey(req));
            if (!key) {
                failures.hit(ip);
                return fail(res, 401, 'invalid_api_key', 'API key không hợp lệ hoặc đã bị thu hồi.');
            }
            if (!hasScope(key, scope)) return fail(res, 403, 'insufficient_scope', 'API key không có quyền thực hiện thao tác này.');

            req.apiKey = key;
            next();
        } catch (e) {
            next(e);
        }
    };
}

/** 60 yêu cầu/phút cho mỗi API key. */
const perKeyLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    keyFn: (req) => 'key:' + (req.apiKey ? req.apiKey.id : req.ip)
});

module.exports = { apiKeyAuth, perKeyLimiter, extractKey };
