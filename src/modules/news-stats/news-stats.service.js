/**
 * Thống kê tin ẩn theo bài và theo ngày (BA v9, S47).
 * Ghi vào bộ đệm trong bộ nhớ rồi gom ghi vào DB theo lô mỗi 30 giây (và khi tắt tiến trình),
 * để mỗi lượt xem/bấm không tốn một truy vấn DB trên VPS 1 vCPU.
 */
const prisma = require('../../config/db');

const EVENTS = ['view', 'popup_show', 'popup_close', 'cta_popup', 'cta_banner', 'cta_inline'];
const CLIENT_EVENTS = ['popup_show', 'popup_close', 'cta_popup', 'cta_banner', 'cta_inline']; // 'view' do server đếm
const FLUSH_INTERVAL_MS = 30 * 1000;
const MAX_BUFFER_KEYS = 5000;

const BOT_RE = /bot|crawl|spider|slurp|facebookexternalhit|facebot|preview|embedly|whatsapp|telegram|zalo|curl|wget|python-requests|httpclient|headless|lighthouse|pingdom|uptime|monitor/i;

let buffer = new Map(); // "postId|YYYY-MM-DD|event" -> count
let timer = null;
let flushing = null;

const isBot = (ua) => !ua || BOT_RE.test(String(ua));

/** Ngày theo giờ Việt Nam, dạng YYYY-MM-DD. */
function dayString(date = new Date()) {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

function start() {
    if (timer) return;
    timer = setInterval(() => { flush().catch(() => {}); }, FLUSH_INTERVAL_MS);
    if (timer.unref) timer.unref();
}

/** Ghi nhận 1 sự kiện vào bộ đệm. Trả false nếu bị bỏ qua. */
function record(postId, event, n = 1) {
    if (!Number.isInteger(postId) || !EVENTS.includes(event)) return false;
    start();
    const key = `${postId}|${dayString()}|${event}`;
    if (!buffer.has(key) && buffer.size >= MAX_BUFFER_KEYS) return false; // chống phình bộ nhớ
    buffer.set(key, (buffer.get(key) || 0) + n);
    return true;
}

/** Ghi bộ đệm xuống DB. Lỗi thì trả số liệu về bộ đệm để thử lại lần sau. */
function flush() {
    if (flushing) return flushing;
    if (buffer.size === 0) return Promise.resolve(0);
    const batch = buffer;
    buffer = new Map();
    flushing = (async () => {
        let written = 0;
        for (const [key, count] of batch) {
            const [postId, day, event] = key.split('|');
            const where = { post_id_day_event: { post_id: Number(postId), day: new Date(day + 'T00:00:00.000Z'), event } };
            try {
                await prisma.newsStatDaily.upsert({
                    where,
                    create: { post_id: Number(postId), day: where.post_id_day_event.day, event, count },
                    update: { count: { increment: count } }
                });
                written++;
            } catch (e) {
                // Bài đã bị xóa (khóa ngoại) thì bỏ; lỗi khác thì trả lại bộ đệm.
                if (e && e.code !== 'P2003') buffer.set(key, (buffer.get(key) || 0) + count);
            }
        }
        return written;
    })().finally(() => { flushing = null; });
    return flushing;
}

/** Gọi trong server.js: flush khi PM2/hệ thống dừng tiến trình rồi thoát. */
function registerShutdownFlush() {
    let done = false;
    const handler = (signal) => {
        if (done) return;
        done = true;
        const force = setTimeout(() => process.exit(0), 1500);
        if (force.unref) force.unref();
        flush().catch(() => {}).finally(() => process.exit(signal === 'SIGINT' || signal === 'SIGTERM' ? 0 : 1));
    };
    process.once('SIGINT', () => handler('SIGINT'));
    process.once('SIGTERM', () => handler('SIGTERM'));
}

/** Thống kê một bài trong N ngày gần nhất (cho trang admin). */
async function getPostStats(postId, days = 30) {
    await flush();
    const since = new Date(dayString(new Date(Date.now() - (days - 1) * 86400000)) + 'T00:00:00.000Z');
    const rows = await prisma.newsStatDaily.findMany({ where: { post_id: postId, day: { gte: since } }, orderBy: { day: 'asc' } });
    const totals = Object.fromEntries(EVENTS.map((e) => [e, 0]));
    const byDay = new Map();
    for (let i = days - 1; i >= 0; i--) {
        const d = dayString(new Date(Date.now() - i * 86400000));
        byDay.set(d, Object.fromEntries(EVENTS.map((e) => [e, 0])));
    }
    rows.forEach((r) => {
        const d = new Date(r.day).toISOString().slice(0, 10);
        if (byDay.has(d)) byDay.get(d)[r.event] = (byDay.get(d)[r.event] || 0) + r.count;
        totals[r.event] = (totals[r.event] || 0) + r.count;
    });
    return { totals, days: [...byDay.entries()].map(([day, v]) => ({ day, ...v })) };
}

module.exports = {
    EVENTS,
    CLIENT_EVENTS,
    isBot,
    dayString,
    record,
    flush,
    registerShutdownFlush,
    getPostStats,
    _buffer: () => buffer,
    _reset: () => { buffer = new Map(); }
};
