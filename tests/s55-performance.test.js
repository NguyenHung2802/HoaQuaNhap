// Kiểm thử S55 (tốc độ tải giao diện v2): không còn phụ thuộc CDN ngoài, thư viện tự phục vụ + cache dài,
// phông chữ/preload hợp lệ, hero không chờ JS, classic không đổi. DB giả lập, HTTP thật.
// Chạy: node tests/s55-performance.test.js (sau khi npm install).
const path = require('path');
const fs = require('fs');
const http = require('http');
const assert = require('assert');
const Module = require('module');

const root = path.join(__dirname, '..');
process.env.NODE_ENV = 'test';
delete process.env.UI_THEME;

const fake = require('./helpers/fake-shop-prisma').create();
const origLoad = Module._load;
Module._load = function (request) {
    if (request === '@prisma/client') return { PrismaClient: function () { return fake.prisma; } };
    return origLoad.apply(this, arguments);
};
const app = require(path.join(root, 'src/app.js'));

let pass = 0, failN = 0;
const t = async (name, fn) => { try { await fn(); pass++; console.log('ok  ', name); } catch (e) { failN++; console.log('FAIL', name, '\n    ', e.message); } };

(async () => {
    const server = app.listen(0);
    const port = server.address().port;
    const get = (p) => new Promise((resolve, reject) => {
        http.get({ host: '127.0.0.1', port, path: p, headers: { Host: 'haianhfruit.com' } }, (res) => { let b = ''; res.setEncoding('utf8'); res.on('data', (c) => { b += c; }); res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: b })); }).on('error', reject);
    });
    const withTheme = async (theme, p) => { if (theme === 'classic') process.env.UI_THEME = 'classic'; try { return await get(p); } finally { delete process.env.UI_THEME; } };
    const headOf = (h) => h.slice(0, h.indexOf('</head>'));
    const external = (h) => [...h.matchAll(/(?:href|src)="(https?:\/\/[^"]+)"/g)].map((m) => new URL(m[1]).host);

    await t('v2: phần <head> và script của layout KHÔNG còn tải gì từ CDN bên ngoài (jsdelivr, unpkg, cdnjs, Google Fonts)', async () => {
        for (const p of ['/', '/products', '/cart']) {
            const h = (await get(p)).body; const layoutExternal = external(headOf(h)).concat(external(h.slice(h.indexOf('<script>\n        const AUTH_STATE'))));
            const bad = layoutExternal.filter((x) => /jsdelivr|unpkg|cdnjs|googleapis|gstatic/.test(x));
            assert.deepStrictEqual(bad, [], p + ': ' + bad.join(', '));
        }
    });
    await t('v2: không nạp AOS (bộ hiện dần do theme-v2.js đảm nhiệm), nội dung [data-aos] hiển thị sẵn', async () => {
        const h = (await get('/')).body; assert(!/aos\.(css|js)/.test(h) && !h.includes('AOS.init'));
    });
    await t('classic: layout cũ giữ NGUYÊN (CDN, AOS), không nạp vendor/theme', async () => {
        const h = (await withTheme('classic', '/')).body; for (const w of ['cdn.jsdelivr.net/npm/bootstrap', 'cdnjs.cloudflare.com', 'fonts.googleapis.com', 'unpkg.com/aos', 'AOS.init']) assert(h.includes(w), w);
        assert(!h.includes('/vendor/') && !h.includes('theme-v2'));
    });
    await t('mọi tệp vendor mà layout v2 tham chiếu đều tồn tại và được phục vụ 200', async () => {
        const h = (await get('/')).body; const urls = [...new Set([...h.matchAll(/(?:href|src)="(\/vendor\/[^"]+)"/g)].map((m) => m[1]))];
        assert(urls.length >= 8, 'chỉ có ' + urls.length);
        for (const u of urls) { const r = await get(u); assert.strictEqual(r.status, 200, u); }
    });
    await t('/vendor có cache dài, bất biến; tài nguyên riêng của site không bị cache dài nhầm', async () => {
        const r = await get('/vendor/bootstrap/bootstrap.min.css'); assert(/max-age=2592000/.test(r.headers['cache-control']) && /immutable/.test(r.headers['cache-control']), r.headers['cache-control']);
        const own = await get('/css/style.css'); assert(!/max-age=2592000/.test(own.headers['cache-control'] || ''), 'style.css không được cache 30 ngày: ' + own.headers['cache-control']);
    });
    await t('Font Awesome: mọi webfont mà CSS tham chiếu đều có sẵn (không lỗi 404 làm mất biểu tượng)', async () => {
        const css = (await get('/vendor/fontawesome/css/all.min.css')).body; const woff = [...new Set([...css.matchAll(/url\(\.\.\/webfonts\/([a-z0-9\-]+\.woff2)\)/g)].map((m) => m[1]))];
        assert(woff.length >= 4); for (const f of woff) assert.strictEqual((await get('/vendor/fontawesome/webfonts/' + f)).status, 200, f);
    });
    await t('phông chữ tự phục vụ: fonts.css trỏ đúng tệp có thật, đủ Outfit + Playfair + tiếng Việt, preload khớp', async () => {
        const css = (await get('/vendor/fonts/fonts.css')).body; const files = [...new Set([...css.matchAll(/url\((\/vendor\/fonts\/[^)]+\.woff2)\)/g)].map((m) => m[1]))];
        assert(files.length >= 6); for (const f of files) assert.strictEqual((await get(f)).status, 200, f);
        assert(/font-family: 'Outfit'/.test(css) && /font-family: 'Playfair Display'/.test(css) && /\/\* vietnamese \*\//.test(css)); assert(!/display:\s*block/.test(css) && /font-display: swap/.test(css));
        const h = (await get('/')).body; const pre = [...h.matchAll(/<link rel="preload" href="([^"]+)" as="font"[^>]*crossorigin>/g)].map((m) => m[1]);
        assert(pre.length >= 2); pre.forEach((u) => assert(files.includes(u), 'preload không khớp tệp: ' + u));
    });
    await t('thứ tự nạp: phông + bootstrap + FA + swiper trước style.css/theme-v2.css (ghi đè đúng)', async () => {
        const h = (await get('/')).body; const idx = (s) => h.indexOf(s);
        assert(idx('/vendor/bootstrap/bootstrap.min.css') < idx('/css/style.css') && idx('/css/style.css') < idx('/css/theme-v2.css'));
    });
    await t('footer: ảnh logo thanh toán (tên miền ngoài) tải lười, không tranh băng thông với phần hiển thị đầu trang', async () => {
        const h = (await get('/')).body; const foot = h.slice(h.indexOf('<footer')); const imgs = foot.match(/<img [^>]*>/g) || []; assert(imgs.length >= 2);
        imgs.forEach((i) => assert(/loading="lazy"/.test(i), i));
    });
    await t('hero v2 hiện bằng CSS thuần: có animation cho slide đầu trước khi Swiper khởi tạo, và chỉ ẩn slide khác sau khi đã khởi tạo', async () => {
        const css = fs.readFileSync(path.join(root, 'public/css/home-v2.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
        assert(/:not\(\.swiper-initialized\) \.swiper-slide:first-child \.hv2-copy > \*/.test(css), 'thiếu animation CSS thuần cho slide đầu');
        assert(/:not\(\.swiper-initialized\) \.swiper-slide:not\(:first-child\)\s*\{\s*display:\s*none/.test(css), 'thiếu ẩn slide sau trước khi khởi tạo (chống giật bố cục)');
        const hidden = css.split('}').filter((b) => /opacity:\s*0\s*;/.test(b) && /hv2-copy/.test(b)); assert(hidden.length && hidden.every((b) => /swiper-initialized\s+\.swiper-slide:not\(\.swiper-slide-active\)/.test(b)), 'chữ chỉ được ẩn ở slide KHÔNG hoạt động sau khi khởi tạo');
        const dur = css.match(/hv2-up\s+([\d.]+)s/); assert(dur && parseFloat(dur[1]) <= 0.6, 'animation hero phải ngắn (<= 0.6s)');
    });
    await t('chuyển trang: không làm trang cũ mờ dần; trang mới hiện trong <= 0.2s', async () => {
        const css = fs.readFileSync(path.join(root, 'public/css/theme-v2.css'), 'utf8');
        assert(/::view-transition-old\(root\)\s*\{\s*animation:\s*none/.test(css)); const m = css.match(/::view-transition-new\(root\)\s*\{\s*animation:\s*tv2-in\s+([\d.]+)s/); assert(m && parseFloat(m[1]) <= 0.2);
    });
    await t('theme-v2.js: hiện dần không phụ thuộc AOS, bỏ qua phần tử đã nhìn thấy khi tải, thời gian ngắn', async () => {
        const src = fs.readFileSync(path.join(root, 'public/js/theme-v2.js'), 'utf8'); new Function(src);
        assert(src.includes("[data-aos]") && !/AOS\./.test(src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')));
        assert(/getBoundingClientRect\(\)\.top < vh \* 1\.05/.test(src) && /Math\.min\(idx \* 50, 200\)/.test(src));
        const css = fs.readFileSync(path.join(root, 'public/css/theme-v2.css'), 'utf8'); const tr = css.match(/\.tv2-reveal \{[^}]*transition: opacity ([\d.]+)s/); assert(tr && parseFloat(tr[1]) <= 0.5);
    });

    console.log(`\nTổng ok: ${pass}, lỗi: ${failN}`);
    server.close(); process.exit(failN ? 1 : 0);
})();
