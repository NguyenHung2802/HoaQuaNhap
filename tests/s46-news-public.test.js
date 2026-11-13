// Kiểm thử S46: định tuyến theo host và trang tin ẩn công khai. Gọi HTTP thật với Host header khác nhau.
// DB giả lập trong bộ nhớ. Chạy: node tests/s46-news-public.test.js (sau khi npm install).
const path = require('path');
const http = require('http');
const assert = require('assert');
const Module = require('module');

const root = path.join(__dirname, '..');
process.env.NODE_ENV = 'test';

const TOKEN = 'Xk3p9QmT2vLw8aRf1nZc7d'; // 22 ký tự base64url
const db = { settings: [], failFind: false, posts: [
    { id: 1, post_type: 'news', is_published: true, title: 'Ưu đãi hôm nay <b>nóng</b>', slug: 'uu-dai-hom-nay', url_date: '12-11-2026', access_token: TOKEN,
      summary: 'Tóm tắt bài', content: '<p>Nội dung bài <strong>đậm</strong></p>', thumbnail_url: 'https://res.cloudinary.com/demo/image/upload/v1/c.jpg',
      gallery: ['https://res.cloudinary.com/demo/image/upload/v1/g1.jpg'], video_url: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
      affiliate_url: 'https://s.shopee.vn/abc', ad_headline: 'Giảm 50%', ad_cta_text: 'Mua ngay', tags: 'khuyen mai,shopee', seo_title: null, seo_description: null,
      published_at: new Date('2026-11-12T03:00:00Z'), created_at: new Date('2026-11-12T03:00:00Z') },
    { id: 2, post_type: 'news', is_published: false, title: 'Bản nháp', slug: 'ban-nhap', url_date: '12-11-2026', access_token: 'Dr4ftTokenTokenTokenAa', content: '<p>x</p>', created_at: new Date() },
    { id: 3, post_type: 'blog', is_published: true, title: 'Blog thường', slug: 'blog-thuong', url_date: '12-11-2026', access_token: 'BlogTokenTokenTokenTok', content: '<p>x</p>', created_at: new Date() },
    { id: 4, post_type: 'news', is_published: true, title: 'Không affiliate', slug: 'khong-aff', url_date: '01-01-2026', access_token: 'NoAffTokenTokenTokenAa', content: '<p>Chỉ chữ</p>', affiliate_url: null, published_at: new Date(), created_at: new Date() }
] };
const fakePrisma = {
    category: { findMany: async () => [] },
    setting: { findMany: async () => db.settings },
    blogPost: {
        findUnique: async ({ where }) => {
            if (db.failFind) throw new Error('DB down');
            return db.posts.find((p) => (where.access_token && p.access_token === where.access_token) || (where.id && p.id === where.id)) || null;
        },
        findMany: async () => [], count: async () => 0
    }
};
const origLoad = Module._load;
Module._load = function (request) {
    if (request === '@prisma/client') return { PrismaClient: function () { return fakePrisma; } };
    return origLoad.apply(this, arguments);
};

const app = require(path.join(root, 'src/app.js'));
const newsSettings = require(path.join(root, 'src/modules/settings/news-settings.service.js'));

let pass = 0, failN = 0;
const t = async (name, fn) => { try { await fn(); pass++; console.log('ok  ', name); } catch (e) { failN++; console.log('FAIL', name, '\n    ', e.message); } };

(async () => {
    const server = app.listen(0);
    const port = server.address().port;
    const get = (urlPath, host, extra = {}) => new Promise((resolve, reject) => {
        const req = http.request({ host: '127.0.0.1', port, path: urlPath, method: extra.method || 'GET', headers: { Host: host, ...(extra.headers || {}) } }, (res) => {
            let body = ''; res.setEncoding('utf8'); res.on('data', (c) => { body += c; });
            res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
        });
        req.on('error', reject); req.end();
    });
    const NEWS = 'tin.haianhfruit.com', MAIN = 'haianhfruit.com';
    const good = `/tin-tuc/12-11-2026/uu-dai-hom-nay/${TOKEN}`;
    const setSetting = (k, v) => { const r = db.settings.find((s) => s.key === k); r ? (r.value = v) : db.settings.push({ key: k, value: v }); newsSettings.invalidate(); };

    await t('URL đúng trên host tin ẩn -> 200 và đủ nội dung', async () => {
        const r = await get(good, NEWS);
        assert.strictEqual(r.status, 200);
        assert(r.body.includes('Ưu đãi hôm nay &lt;b&gt;nóng&lt;/b&gt;'), 'tiêu đề phải được escape');
        assert(r.body.includes('<strong>đậm</strong>')); assert(r.body.includes('Tóm tắt bài'));
        assert(r.body.includes('youtube-nocookie.com/embed/dQw4w9WgXcQ')); assert(r.body.includes('f_auto,q_auto,w_1200')); assert(r.body.includes('#khuyen mai'));
        assert(r.body.includes('liên kết tiếp thị')); assert(r.body.includes('data-cta="inline"') && r.body.includes('rel="sponsored nofollow noopener noreferrer"') && r.body.includes('https://s.shopee.vn/abc'));
        assert(r.body.includes('Mua ngay') && r.body.includes('Giảm 50%'));
        assert(r.body.includes('property="og:title"') && r.body.includes('property="og:image"'));
        assert(r.body.includes('data-post-id="1"'));
    });
    await t('tiêu đề chống lập chỉ mục + không cookie + không session', async () => {
        const r = await get(good, NEWS);
        assert(/noindex/.test(r.headers['x-robots-tag']) && /nofollow/.test(r.headers['x-robots-tag']));
        assert(r.body.includes('<meta name="robots" content="noindex, nofollow, noarchive">'));
        assert(!r.headers['set-cookie'], 'không được đặt cookie ở host tin ẩn');
        assert.strictEqual(r.headers['cache-control'], 'no-cache');
    });
    await t('trang tin ẩn không chứa menu/giỏ hàng/đăng nhập của web bán hàng', async () => {
        const r = await get(good, NEWS);
        for (const w of ['navbar', 'Giỏ hàng', 'cart', '/auth/login', '/products', 'Hải Anh Fruit']) assert(!r.body.includes(w), 'lộ: ' + w);
    });
    await t('bài không có affiliate (và chưa có link mặc định) -> không hiện khối CTA', async () => {
        const r = await get('/tin-tuc/01-01-2026/khong-aff/NoAffTokenTokenTokenAa', NEWS);
        assert.strictEqual(r.status, 200); assert(!r.body.includes('cta-inline'));
    });
    await t('link mặc định được dùng khi bài không có link riêng', async () => {
        setSetting('news.default_affiliate_url', 'https://vt.tiktok.com/ZSdefault/');
        const r = await get('/tin-tuc/01-01-2026/khong-aff/NoAffTokenTokenTokenAa', NEWS);
        assert(r.body.includes('https://vt.tiktok.com/ZSdefault/'));
        const own = await get(good, NEWS); assert(own.body.includes('https://s.shopee.vn/abc') && !own.body.includes('ZSdefault'));
        setSetting('news.default_affiliate_url', '');
    });

    const neutral = (r) => { assert.strictEqual(r.status, 404); assert(r.body.includes('404')); assert(!r.body.includes('Hải Anh') && !r.body.includes('navbar')); assert(/noindex/.test(r.headers['x-robots-tag'])); assert(!r.headers['set-cookie']); };
    await t('sai token / slug / ngày / định dạng -> 404 trung tính', async () => {
        for (const p of [
            `/tin-tuc/12-11-2026/uu-dai-hom-nay/${TOKEN.slice(0, -1)}A`,
            `/tin-tuc/12-11-2026/slug-khac/${TOKEN}`,
            `/tin-tuc/13-11-2026/uu-dai-hom-nay/${TOKEN}`,
            `/tin-tuc/2026-11-12/uu-dai-hom-nay/${TOKEN}`,
            `/tin-tuc/12-11-2026/UU-DAI/${TOKEN}`,
            `/tin-tuc/12-11-2026/uu-dai-hom-nay/short`,
            `/tin-tuc/12-11-2026/uu-dai-hom-nay/${TOKEN}extra`
        ]) neutral(await get(p, NEWS));
    });
    await t('bản nháp và bài blog có token -> 404', async () => {
        neutral(await get('/tin-tuc/12-11-2026/ban-nhap/Dr4ftTokenTokenTokenAa', NEWS));
        neutral(await get('/tin-tuc/12-11-2026/blog-thuong/BlogTokenTokenTokenTok', NEWS));
    });
    await t('host tin ẩn chỉ có đúng một đường dẫn: các đường khác 404', async () => {
        for (const p of ['/', '/products', '/admin', '/admin/login', '/api/v1/posts', '/blog/blog-thuong', '/tin-tuc', '/sitemap.xml', '/auth/login', '/cart']) neutral(await get(p, NEWS));
    });
    await t('robots.txt của host tin ẩn chặn toàn bộ; của host chính vẫn như cũ', async () => {
        const n = await get('/robots.txt', NEWS); assert.strictEqual(n.status, 200); assert(n.body.includes('Disallow: /') && !n.body.includes('Allow: /\n'));
        const m = await get('/robots.txt', MAIN); assert(m.body.includes('Allow: /') && !m.body.includes('tin-tuc'));
    });
    await t('host chính KHÔNG phục vụ đường dẫn tin ẩn -> 404 (và không lộ nội dung)', async () => {
        for (const h of [MAIN, 'localhost:3000', '127.0.0.1', 'www.haianhfruit.com', 'tin.haianhfruit.com.evil.com', 'xtin.haianhfruit.com']) {
            const r = await get(good, h); assert.strictEqual(r.status, 404, h); assert(!r.body.includes('Ưu đãi hôm nay'), h); assert(!r.body.includes('data-post-id'), h);
        }
    });
    await t('Host viết hoa vẫn khớp', async () => assert.strictEqual((await get(good, 'TIN.HaiAnhFruit.COM')).status, 200));
    await t('host có cổng (tin.localhost:3000) cấu hình riêng vẫn khớp', async () => {
        setSetting('news.host', 'tin.localhost:3000');
        assert.strictEqual((await get(good, 'tin.localhost:3000')).status, 200);
        assert.strictEqual((await get(good, NEWS)).status, 404);
        setSetting('news.host', 'tin.haianhfruit.com');
    });
    await t('asset không tồn tại -> 404 trung tính', async () => neutral(await get('/assets/khong-co.js', NEWS)));
    await t('POST/PUT lên host tin ẩn -> 404', async () => { neutral(await get(good, NEWS, { method: 'POST' })); });
    await t('lỗi DB ở host tin ẩn -> 500 chữ thuần, không lộ trang web bán hàng', async () => {
        db.failFind = true; const r = await get(good, NEWS); db.failFind = false;
        assert.strictEqual(r.status, 500); assert(!r.body.includes('<html') && !r.body.includes('Hải Anh')); assert(!r.headers['set-cookie']);
    });
    await t('công tắc news.enabled=false -> mọi đường dẫn tin ẩn 404', async () => {
        setSetting('news.enabled', 'false'); neutral(await get(good, NEWS)); setSetting('news.enabled', 'true');
        assert.strictEqual((await get(good, NEWS)).status, 200);
    });
    await t('web chính vẫn chạy bình thường (có cookie/session và 404 riêng)', async () => {
        const r = await get('/khong-ton-tai', MAIN); assert.strictEqual(r.status, 404);
    });
    await t('dò đường dẫn quá 30 lần/phút -> 429, kể cả link hợp lệ', async () => {
        let limited = false;
        for (let i = 0; i < 40 && !limited; i++) { const r = await get(`/tin-tuc/12-11-2026/x${i}/${TOKEN}`, NEWS); if (r.status === 429) limited = true; }
        assert(limited, 'phải bị 429');
        const ok = await get(good, NEWS); assert.strictEqual(ok.status, 429); assert(ok.headers['retry-after']);
    });

    console.log(`\nTổng ok: ${pass}, lỗi: ${failN}`);
    server.close(); process.exit(failN ? 1 : 0);
})();
