// Kiểm thử S47 (phía server): cấu hình popup trong trang, beacon /t, đếm lượt vào, lọc bot,
// gom ghi thống kê theo lô, trang thống kê admin. Phần JS trình duyệt được thử riêng bằng trình duyệt thật.
// Chạy: node tests/s47-popup-stats.test.js (sau khi npm install). DB giả lập trong bộ nhớ.
const path = require('path');
const http = require('http');
const assert = require('assert');
const Module = require('module');

const root = path.join(__dirname, '..');
process.env.NODE_ENV = 'test';

const TOKEN = 'Xk3p9QmT2vLw8aRf1nZc7d';
const EVIL = '</script><img src=x onerror=alert(1)> & "q"';
const db = { settings: [], stats: [], upsertFail: null, upsertCalls: 0, posts: [
    { id: 1, post_type: 'news', is_published: true, title: 'Bài chính', slug: 'bai-chinh', url_date: '12-11-2026', access_token: TOKEN, summary: 's', content: '<p>x</p>',
      thumbnail_url: 'https://res.cloudinary.com/demo/image/upload/v1/c.jpg', ad_image_url: 'https://res.cloudinary.com/demo/image/upload/v1/ad.jpg', affiliate_url: 'https://s.shopee.vn/abc',
      ad_headline: EVIL, ad_cta_text: 'Mua ngay', published_at: new Date(), created_at: new Date() },
    { id: 2, post_type: 'news', is_published: true, title: 'Không aff', slug: 'khong-aff', url_date: '12-11-2026', access_token: 'NoAffTokenTokenTokenAa', content: '<p>x</p>', affiliate_url: null, published_at: new Date(), created_at: new Date() },
    { id: 3, post_type: 'news', is_published: false, title: 'Nháp', slug: 'nhap', url_date: '12-11-2026', access_token: 'Dr4ftTokenTokenTokenAa', content: '<p>x</p>', created_at: new Date() }
] };
const keyOf = (w) => `${w.post_id}|${new Date(w.day).toISOString().slice(0, 10)}|${w.event}`;
const fakePrisma = {
    category: { findMany: async () => [] },
    user: { findFirst: async () => ({ id: 1 }) },
    setting: { findMany: async () => db.settings, upsert: async () => {} },
    newsStatDaily: {
        upsert: async ({ where, create, update }) => {
            db.upsertCalls++;
            if (db.upsertFail) { const e = db.upsertFail; db.upsertFail = null; throw e; }
            const w = where.post_id_day_event; const row = db.stats.find((r) => keyOf(r) === keyOf(w));
            if (row) row.count += update.count.increment; else db.stats.push({ ...create });
        },
        findMany: async ({ where }) => db.stats.filter((r) => r.post_id === where.post_id && new Date(r.day) >= where.day.gte),
        groupBy: async ({ where }) => {
            const out = {};
            db.stats.filter((s) => where.post_id.in.includes(s.post_id)).forEach((s) => { const k = s.post_id + '|' + s.event; out[k] = out[k] || { post_id: s.post_id, event: s.event, _sum: { count: 0 } }; out[k]._sum.count += s.count; });
            return Object.values(out);
        }
    },
    blogPost: {
        findUnique: async ({ where }) => db.posts.find((p) => (where.access_token && p.access_token === where.access_token) || (where.id && p.id === where.id)) || null,
        findMany: async () => db.posts.filter((p) => p.post_type === 'news').map((p) => ({ ...p })), count: async () => db.posts.length
    }
};
const origLoad = Module._load;
Module._load = function (request) {
    if (request === '@prisma/client') return { PrismaClient: function () { return fakePrisma; } };
    return origLoad.apply(this, arguments);
};
const auth = require(path.join(root, 'src/middlewares/auth.middleware.js'));
auth.isAdmin = (req, res, next) => { req.session.user = { id: 1, role: 'admin', full_name: 'Admin Test' }; next(); };

const app = require(path.join(root, 'src/app.js'));
const stats = require(path.join(root, 'src/modules/news-stats/news-stats.service.js'));
const ctrl = require(path.join(root, 'src/modules/public/news/news.public.controller.js'));

let pass = 0, failN = 0;
const t = async (name, fn) => { try { await fn(); pass++; console.log('ok  ', name); } catch (e) { failN++; console.log('FAIL', name, '\n    ', e.message); } };
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile Safari/604.1';

(async () => {
    const server = app.listen(0);
    const port = server.address().port;
    const send = (method, urlPath, host, { body, headers = {}, ua = UA } = {}) => new Promise((resolve, reject) => {
        const data = body === undefined ? null : (typeof body === 'string' ? body : JSON.stringify(body));
        const h = { Host: host, ...headers };
        if (ua) h['User-Agent'] = ua;
        if (data !== null) { h['Content-Type'] = h['Content-Type'] || 'application/json'; h['Content-Length'] = Buffer.byteLength(data); }
        const req = http.request({ host: '127.0.0.1', port, path: urlPath, method, headers: h }, (res) => {
            let b = ''; res.setEncoding('utf8'); res.on('data', (c) => { b += c; }); res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: b }));
        });
        req.on('error', reject); if (data !== null) req.write(data); req.end();
    });
    const NEWS = 'tin.haianhfruit.com', MAIN = 'haianhfruit.com';
    const page = `/tin-tuc/12-11-2026/bai-chinh/${TOKEN}`;
    const beacon = (event, extra = {}, opts = {}) => send('POST', '/t', NEWS, { body: { id: 1, token: TOKEN, event, ...extra }, ...opts });
    const sumOf = (postId, event) => db.stats.filter((r) => r.post_id === postId && r.event === event).reduce((s, r) => s + r.count, 0);

    await t('trang có cấu hình popup + script; JSON hợp lệ và đủ trường', async () => {
        const r = await send('GET', page, NEWS);
        assert.strictEqual(r.status, 200);
        assert(r.body.includes('<script src="/assets/news.js" defer></script>'));
        const m = r.body.match(/<script type="application\/json" id="news-config">([\s\S]*?)<\/script>/); assert(m, 'thiếu news-config');
        const cfg = JSON.parse(m[1]);
        assert.strictEqual(cfg.postId, 1); assert.strictEqual(cfg.token, TOKEN); assert.strictEqual(cfg.affiliateUrl, 'https://s.shopee.vn/abc');
        assert.strictEqual(cfg.delayMs, 1500); assert.strictEqual(cfg.cta, 'Mua ngay'); assert(cfg.image.includes('f_auto,q_auto,w_900') && cfg.image.includes('/ad.jpg'));
        assert.strictEqual(cfg.headline, EVIL, 'phải giải mã lại đúng chuỗi gốc');
    });
    await t('JSON cấu hình không thể thoát khỏi thẻ script (XSS)', async () => {
        const r = await send('GET', page, NEWS);
        assert(!r.body.includes('</script><img'), 'lộ chuỗi thoát script');
        const cfgBlock = r.body.match(/id="news-config">([\s\S]*?)<\/script>/)[1];
        assert(!/[<>&]/.test(cfgBlock), 'khối JSON còn ký tự < > &');
        assert(!/<img src=x onerror/.test(r.body), 'thẻ img độc không được xuất hiện nguyên bản (ở ngoài khối JSON, ad_headline phải được escape HTML)');
        assert(r.body.includes('&lt;img src=x onerror'), 'tiêu đề quảng cáo trong HTML phải được escape');
    });
    await t('độ trễ popup lấy từ cài đặt', async () => {
        db.settings.push({ key: 'news.popup_delay_ms', value: '4200' }); require(path.join(root, 'src/modules/settings/news-settings.service.js')).invalidate();
        const cfg = JSON.parse((await send('GET', page, NEWS)).body.match(/id="news-config">([\s\S]*?)<\/script>/)[1]);
        assert.strictEqual(cfg.delayMs, 4200);
        db.settings.length = 0; require(path.join(root, 'src/modules/settings/news-settings.service.js')).invalidate();
    });
    await t('bài không có affiliate -> không có popup/script/config', async () => {
        const r = await send('GET', '/tin-tuc/12-11-2026/khong-aff/NoAffTokenTokenTokenAa', NEWS);
        assert.strictEqual(r.status, 200); assert(!r.body.includes('id="news-config"') && !r.body.includes('<script src="/assets/news.js"'));
    });
    await t('/assets/news.js được phục vụ (JS, có cache) trên host tin ẩn', async () => {
        const r = await send('GET', '/assets/news.js', NEWS); assert.strictEqual(r.status, 200); assert(/javascript/.test(r.headers['content-type'])); assert(r.body.includes('Quảng cáo · Liên kết tiếp thị')); assert(/max-age=604800/.test(r.headers['cache-control']));
        assert.strictEqual((await send('GET', '/assets/news.js', MAIN)).status, 404);
    });

    stats._reset();
    await t('lượt vào được đếm ở server; bot, trình xem trước và không UA thì không', async () => {
        await send('GET', page, NEWS); await send('GET', page, NEWS);
        for (const ua of ['Mozilla/5.0 (compatible; Googlebot/2.1)', 'facebookexternalhit/1.1', 'Zalo-Link-Preview', 'curl/8.0', null]) await send('GET', page, NEWS, { ua });
        const total = [...stats._buffer().entries()].filter(([k]) => k.endsWith('|view')).reduce((s, [, v]) => s + v, 0);
        assert.strictEqual(total, 2);
    });
    await t('trang không tồn tại / nháp không tăng lượt vào', async () => {
        const before = stats._buffer().size; await send('GET', '/tin-tuc/12-11-2026/nhap/Dr4ftTokenTokenTokenAa', NEWS); await send('GET', '/tin-tuc/12-11-2026/sai/' + TOKEN, NEWS);
        assert.strictEqual(stats._buffer().size, before);
    });
    await t('beacon hợp lệ cho cả 5 sự kiện -> 204 và vào bộ đệm', async () => {
        for (const e of ['popup_show', 'popup_close', 'cta_popup', 'cta_banner', 'cta_inline']) { const r = await beacon(e); assert.strictEqual(r.status, 204, e); }
        const keys = [...stats._buffer().keys()].map((k) => k.split('|')[2]);
        for (const e of ['popup_show', 'popup_close', 'cta_popup', 'cta_banner', 'cta_inline']) assert(keys.includes(e), e);
    });
    await t('beacon sai: sự kiện lạ, "view" từ client, token sai định dạng, id không phải số, JSON hỏng -> 400', async () => {
        for (const body of [{ id: 1, token: TOKEN, event: 'hack' }, { id: 1, token: TOKEN, event: 'view' }, { id: 1, token: 'ngan', event: 'popup_show' }, { id: '1', token: TOKEN, event: 'popup_show' }, { token: TOKEN, event: 'popup_show' }]) assert.strictEqual((await send('POST', '/t', NEWS, { body })).status, 400, JSON.stringify(body));
        assert.strictEqual((await send('POST', '/t', NEWS, { body: '{bad' })).status, 400);
    });
    await t('beacon sai id / bài nháp / token lạ / bot -> 204 nhưng KHÔNG ghi nhận', async () => {
        const before = JSON.stringify([...stats._buffer()]);
        assert.strictEqual((await beacon('popup_show', { id: 2 })).status, 204);
        assert.strictEqual((await send('POST', '/t', NEWS, { body: { id: 3, token: 'Dr4ftTokenTokenTokenAa', event: 'popup_show' } })).status, 204);
        assert.strictEqual((await send('POST', '/t', NEWS, { body: { id: 1, token: 'Zz9pTokenTokenTokenAaa', event: 'popup_show' } })).status, 204);
        assert.strictEqual((await beacon('popup_show', {}, { ua: 'Googlebot/2.1' })).status, 204);
        assert.strictEqual((await beacon('popup_show', {}, { ua: null })).status, 204);
        assert.strictEqual(JSON.stringify([...stats._buffer()]), before);
    });
    await t('body beacon quá lớn -> 413', async () => assert.strictEqual((await send('POST', '/t', NEWS, { body: { id: 1, token: TOKEN, event: 'popup_show', pad: 'x'.repeat(5000) } })).status, 413));
    await t('/t chỉ có ở host tin ẩn (host chính -> 404) và không dùng GET', async () => {
        assert.strictEqual((await send('POST', '/t', MAIN, { body: { id: 1, token: TOKEN, event: 'popup_show' } })).status, 404);
        assert.strictEqual((await send('GET', '/t', NEWS)).status, 404);
    });

    await t('flush ghi theo lô vào DB, cộng dồn lần sau', async () => {
        const written = await stats.flush(); assert(written >= 6, 'written=' + written);
        assert.strictEqual(sumOf(1, 'view'), 2); assert.strictEqual(sumOf(1, 'cta_popup'), 1); assert.strictEqual(sumOf(1, 'popup_show'), 1);
        assert.strictEqual(stats._buffer().size, 0);
        await beacon('cta_popup'); await beacon('cta_popup'); await stats.flush();
        assert.strictEqual(sumOf(1, 'cta_popup'), 3, 'phải cộng dồn (increment)');
        assert.strictEqual(db.stats.filter((r) => r.post_id === 1 && r.event === 'cta_popup').length, 1, 'cùng ngày chỉ một dòng');
    });
    await t('ngày ghi theo giờ Việt Nam', async () => {
        assert.strictEqual(stats.dayString(new Date('2026-11-12T20:00:00Z')), '2026-11-13');
        assert.strictEqual(stats.dayString(new Date('2026-11-12T16:59:00Z')), '2026-11-12');
    });
    await t('lỗi DB tạm thời: số liệu được giữ lại và ghi ở lần sau', async () => {
        await beacon('popup_show'); db.upsertFail = new Error('DB down');
        const before = sumOf(1, 'popup_show'); await stats.flush();
        assert.strictEqual(sumOf(1, 'popup_show'), before); assert.strictEqual(stats._buffer().size, 1);
        await stats.flush(); assert.strictEqual(sumOf(1, 'popup_show'), before + 1); assert.strictEqual(stats._buffer().size, 0);
    });
    await t('bài đã bị xóa (khóa ngoại P2003): bỏ số liệu, không kẹt bộ đệm', async () => {
        await beacon('popup_show'); db.upsertFail = Object.assign(new Error('fk'), { code: 'P2003' });
        await stats.flush(); assert.strictEqual(stats._buffer().size, 0);
    });
    await t('chống phình bộ nhớ: dừng nhận khóa mới khi quá 5000', async () => {
        stats._reset(); let ok = 0; for (let i = 1; i <= 5100; i++) if (stats.record(100000 + i, 'view')) ok++;
        assert.strictEqual(ok, 5000); assert(stats.record(100001, 'view'), 'khóa đã có vẫn cộng dồn được'); stats._reset();
    });
    await t('record từ chối dữ liệu sai', async () => { assert(!stats.record('1', 'view')); assert(!stats.record(1, 'zzz')); assert(!stats.record(NaN, 'view')); });

    // --- Admin ---
    let cookie = '';
    const adm = async (p) => { const r = await send('GET', p, 'localhost:3000', { headers: { Cookie: cookie }, ua: UA }); if (r.headers['set-cookie']) cookie = r.headers['set-cookie'].map((c) => c.split(';')[0]).join('; '); return r; };
    await t('admin: danh sách tự flush và hiện số liệu mới nhất + liên kết thống kê', async () => {
        stats._reset(); await beacon('cta_banner'); // đang nằm trong bộ đệm, chưa ghi DB
        const r = await adm('/admin/news'); assert.strictEqual(r.status, 200); assert(r.body.includes('/admin/news/stats/1')); assert(sumOf(1, 'cta_banner') >= 1);
    });
    await t('admin: trang thống kê hiện tổng, tỷ lệ, theo vị trí, theo ngày', async () => {
        const r = await adm('/admin/news/stats/1'); assert.strictEqual(r.status, 200);
        for (const w of ['Thống kê tin ẩn', 'Lượt vào', 'Hiện popup', 'Lượt lấn bấm'.slice(0, 0) + 'Lượt bấm link', 'Banner dính', 'Nút cuối bài', 'Tỷ lệ bấm']) assert(r.body.includes(w), w);
        assert(r.body.includes('Bài chính')); const today = stats.dayString().split('-').reverse().join('/'); assert(r.body.includes(today), 'dòng ngày hôm nay');
        assert.strictEqual((r.body.match(/<tr class=/g) || []).length, 30, '30 ngày');
    });
    await t('admin: id sai -> chuyển về danh sách', async () => { for (const p of ['/admin/news/stats/999', '/admin/news/stats/abc']) { const r = await adm(p); assert.strictEqual(r.status, 302); assert.strictEqual(r.headers.location, '/admin/news'); } });

    await t('beacon vượt 120 lần/phút/IP -> 429', async () => {
        let limited = false; for (let i = 0; i < 130 && !limited; i++) { const r = await beacon('popup_show'); if (r.status === 429) limited = true; }
        assert(limited);
    });

    console.log(`\nTổng ok: ${pass}, lỗi: ${failN}`);
    server.close(); process.exit(failN ? 1 : 0);
})();
