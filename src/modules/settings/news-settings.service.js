/**
 * Đọc cấu hình khu tin tức/API (bảng Setting, key `news.*`) có cache ngắn để không truy vấn DB mỗi request.
 */
const prisma = require('../../config/db');
const { parseHostList } = require('../posts/content.service');

const TTL_MS = 30 * 1000;
let cache = null;
let cachedAt = 0;

const DEFAULTS = {
    'news.enabled': 'true',
    'news.host': 'tin.haianhfruit.com',
    'news.default_affiliate_url': '',
    'news.affiliate_hosts': '',
    'news.popup_delay_ms': '1500'
};

async function get(force = false) {
    if (!force && cache && Date.now() - cachedAt < TTL_MS) return cache;
    let rows = [];
    try {
        rows = await prisma.setting.findMany({ where: { key: { startsWith: 'news.' } } });
    } catch (e) {
        if (cache) return cache; // DB lỗi tạm thời: dùng bản cũ
        throw e;
    }
    const map = { ...DEFAULTS };
    rows.forEach((r) => { if (r.value !== null && r.value !== undefined) map[r.key] = r.value; });
    const delay = parseInt(map['news.popup_delay_ms'], 10);
    cache = {
        enabled: String(map['news.enabled']).toLowerCase() !== 'false',
        host: String(map['news.host']).trim().toLowerCase(),
        defaultAffiliateUrl: String(map['news.default_affiliate_url'] || '').trim(),
        affiliateHosts: parseHostList(map['news.affiliate_hosts']),
        affiliateHostsRaw: String(map['news.affiliate_hosts'] || ''),
        popupDelayMs: Number.isFinite(delay) && delay >= 0 ? Math.min(delay, 30000) : 1500
    };
    cachedAt = Date.now();
    return cache;
}

function invalidate() {
    cache = null;
    cachedAt = 0;
}

module.exports = { get, invalidate };
