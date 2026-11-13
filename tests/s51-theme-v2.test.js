// Kiểm thử S51: cờ giao diện v2/classic, tài nguyên CSS/JS, ngăn kéo giỏ hàng (/cart/mini) và luồng giỏ hàng.
// DB giả lập trong bộ nhớ, gọi HTTP thật vào ứng dụng. Chạy: node tests/s51-theme-v2.test.js (sau khi npm install).
const path = require('path');
const fs = require('fs');
const http = require('http');
const assert = require('assert');
const Module = require('module');

const root = path.join(__dirname, '..');
process.env.NODE_ENV = 'test';
delete process.env.UI_THEME;

const db = { products: [
    { id: 1, name: 'Dâu Hàn Quốc', slug: 'dau-han', price: 289000, sale_price: 259000, is_flash_sale: false, flash_sale_price: null, flash_sale_end: null, stock_quantity: 5, status: 'published', category_id: 1, categories: [{ category_id: 1 }], images: [{ image_url: 'https://x.com/dau.jpg', is_thumbnail: true }] },
    { id: 2, name: 'Nho Mỹ', slug: 'nho-my', price: 169000, sale_price: null, is_flash_sale: false, flash_sale_price: null, flash_sale_end: null, stock_quantity: 1, status: 'published', category_id: 1, categories: [], images: [] },
    { id: 3, name: 'Hết hàng', slug: 'het', price: 50000, sale_price: null, is_flash_sale: false, flash_sale_price: null, flash_sale_end: null, stock_quantity: 0, status: 'published', category_id: 1, categories: [], images: [] }
], campaign: { id: 1, name: 'Freeship', type: 'percent', value: 100, min_order_value: 500000 }, failMini: false };
const fakePrisma = {
    category: { findMany: async () => [] },
    promotionCampaign: { findMany: async () => [] },
    shippingCampaign: { findFirst: async () => { if (db.failMini) throw new Error('DB down'); return db.campaign; } },
    cart: { findFirst: async () => null, findMany: async () => [] },
    product: { findMany: async ({ where }) => db.products.filter((p) => !where || !where.id || !where.id.in || where.id.in.includes(p.id)) }
};
const origLoad = Module._load;
Module._load = function (request) {
    if (request === '@prisma/client') return { PrismaClient: function () { return fakePrisma; } };
    return origLoad.apply(this, arguments);
};
const app = require(path.join(root, 'src/app.js'));

let pass = 0, failN = 0;
const t = async (name, fn) => { try { await fn(); pass++; console.log('ok  ', name); } catch (e) { failN++; console.log('FAIL', name, '\n    ', e.message); } };

(async () => {
    const server = app.listen(0);
    const port = server.address().port;
    let cookie = '';
    const call = (method, p, body) => new Promise((resolve, reject) => {
        const data = body === undefined ? null : JSON.stringify(body);
        const headers = { Host: 'haianhfruit.com', Cookie: cookie };
        if (data) { headers['Content-Type'] = 'application/json'; headers['Content-Length'] = Buffer.byteLength(data); }
        const req = http.request({ host: '127.0.0.1', port, path: p, method, headers }, (res) => {
            const sc = res.headers['set-cookie']; if (sc) cookie = sc.map((c) => c.split(';')[0]).join('; ');
            let b = ''; res.setEncoding('utf8'); res.on('data', (c) => { b += c; }); res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: b }));
        });
        req.on('error', reject); if (data) req.write(data); req.end();
    });
    const json = (r) => JSON.parse(r.body);

    await t('mặc định giao diện v2: body.theme-v2, CSS/JS v2, thanh tiến độ, ngăn kéo giỏ', async () => {
        const r = await call('GET', '/khong-ton-tai'); const h = r.body;
        assert(/<body class="theme-v2">/.test(h)); assert(h.includes('/css/theme-v2.css')); assert(h.includes('/js/theme-v2.js') && /theme-v2\.js\?v=s51" defer/.test(h));
        assert(h.includes('id="tv2-progress"') && h.includes('id="tv2-cart"') && h.includes('id="tv2-scrim"'));
        assert(h.indexOf('/css/style.css') < h.indexOf('/css/theme-v2.css'), 'CSS v2 phải nạp sau style.css để ghi đè');
    });
    await t('UI_THEME=classic: không còn bất kỳ phần nào của v2 (quay về giao diện cũ)', async () => {
        process.env.UI_THEME = 'classic';
        try {
            const h = (await call('GET', '/khong-ton-tai')).body;
            assert(/<body class="">/.test(h)); for (const w of ['theme-v2', 'tv2-', 'mini-cart']) assert(!h.includes(w), 'còn: ' + w);
            assert(h.includes('/css/style.css') && h.includes('/js/cart.js'));
        } finally { delete process.env.UI_THEME; }
        assert(/theme-v2/.test((await call('GET', '/khong-ton-tai')).body));
    });
    await t('tài nguyên CSS/JS v2 được phục vụ', async () => {
        const css = await call('GET', '/css/theme-v2.css'); assert.strictEqual(css.status, 200); assert(/text\/css/.test(css.headers['content-type'])); assert(css.body.includes('@view-transition') && css.body.includes('prefers-reduced-motion'));
        const js = await call('GET', '/js/theme-v2.js'); assert.strictEqual(js.status, 200); assert(/javascript/.test(js.headers['content-type']));
    });
    await t('giữ nguyên các thành phần cũ trong layout (navbar, flash, footer, cart.js, thanh điều hướng dưới)', async () => {
        const h = (await call('GET', '/khong-ton-tai')).body;
        for (const w of ['id="mainNavbar"', 'footer-dark', 'app-bottom-nav', '/js/cart.js', 'cart-badge', 'sweetalert2']) assert(h.includes(w), w);
    });

    await t('/cart/mini giỏ trống -> 200 JSON rỗng, không cache', async () => {
        const r = await call('GET', '/cart/mini'); assert.strictEqual(r.status, 200); const j = json(r);
        assert.deepStrictEqual([j.success, j.count, j.totalAmount, j.items.length, j.shipping], [true, 0, 0, 0, null]); assert.strictEqual(r.headers['cache-control'], 'no-store');
    });
    await t('thêm vào giỏ rồi /cart/mini: giá khuyến mãi, thành tiền, tiến độ miễn phí giao hàng', async () => {
        assert.strictEqual(json(await call('POST', '/cart/add', { product_id: 1, quantity: 1 })).count, 1);
        assert.strictEqual(json(await call('POST', '/cart/add', { product_id: 1, quantity: 1 })).count, 2);
        await call('POST', '/cart/add', { product_id: 2, quantity: 1 });
        const j = json(await call('GET', '/cart/mini'));
        assert.strictEqual(j.count, 3); assert.strictEqual(j.items.length, 2);
        const dau = j.items.find((i) => i.product_id === 1);
        assert.strictEqual(dau.price, 259000); assert.strictEqual(dau.original_price, 289000); assert.strictEqual(dau.is_discounted, true); assert.strictEqual(dau.quantity, 2); assert.strictEqual(dau.line_total, 518000);
        assert.strictEqual(j.totalAmount, 518000 + 169000);
        assert.strictEqual(j.shipping.reached, true); assert.strictEqual(j.shipping.progress, 100); assert(/miễn phí giao hàng/.test(j.shipping.message));
        assert(!('category_ids' in dau) && !('category_id' in dau), 'chỉ trả các trường cần cho ngăn kéo');
    });
    await t('tiến độ chưa đủ ngưỡng', async () => {
        await call('POST', '/cart/update', { product_id: 1, quantity: 1 });
        const j = json(await call('GET', '/cart/mini'));
        assert.strictEqual(j.shipping.reached, false); assert(j.shipping.progress < 100 && j.shipping.progress > 0); assert(/Mua thêm/.test(j.shipping.message));
    });
    await t('tăng/giảm/xóa qua API hiện có, /cart/mini phản ánh ngay', async () => {
        await call('POST', '/cart/update', { product_id: 1, quantity: 3 }); assert.strictEqual(json(await call('GET', '/cart/mini')).items.find((i) => i.product_id === 1).quantity, 3);
        await call('POST', '/cart/remove', { product_id: 2 }); assert(!json(await call('GET', '/cart/mini')).items.some((i) => i.product_id === 2));
        await call('POST', '/cart/update', { product_id: 1, quantity: 0 }); const j = json(await call('GET', '/cart/mini')); assert.strictEqual(j.items.length, 0); assert.strictEqual(j.count, 0);
    });
    await t('sản phẩm hết hàng được đánh dấu is_out_of_stock (ngăn kéo chặn thanh toán)', async () => {
        await call('POST', '/cart/add', { product_id: 3, quantity: 1 }); const j = json(await call('GET', '/cart/mini'));
        assert.strictEqual(j.items[0].is_out_of_stock, true); await call('POST', '/cart/remove', { product_id: 3 });
    });
    await t('lỗi máy chủ ở /cart/mini -> 500 JSON an toàn (giao diện sẽ tự về /cart)', async () => {
        await call('POST', '/cart/add', { product_id: 1, quantity: 1 }); db.failMini = true; const r = await call('GET', '/cart/mini'); db.failMini = false;
        assert.strictEqual(r.status, 500); const j = json(r); assert.strictEqual(j.success, false); assert.deepStrictEqual(j.items, []);
    });
    await t('trang giỏ hàng cũ /cart/count vẫn hoạt động', async () => { const j = json(await call('GET', '/cart/count')); assert.strictEqual(j.success, true); assert.strictEqual(j.count, 1); });

    await t('JS v2: có cú pháp hợp lệ, không dùng innerHTML (chống XSS qua tên sản phẩm), tôn trọng giảm chuyển động', async () => {
        const src = fs.readFileSync(path.join(root, 'public/js/theme-v2.js'), 'utf8');
        new Function(src); // kiểm tra cú pháp
        assert(!/innerHTML/.test(src), 'không dùng innerHTML'); assert(/prefers-reduced-motion/.test(src)); assert(/hover: hover/.test(src));
    });
    await t('CSS v2: mọi quy tắc giao diện đều nằm dưới body.theme-v2 hoặc tiền tố tv2 (không rò sang trang admin/tin ẩn)', async () => {
        const css = fs.readFileSync(path.join(root, 'public/css/theme-v2.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
        const bare = css.split('}').map((b) => b.split('{')[0].trim()).filter((sel) => sel && !/^@|^from|^to|^\d+%|^\s*$/.test(sel))
            .filter((sel) => sel.split(',').some((s) => { s = s.trim(); return s && !/^(body\.theme-v2|#tv2-|\.tv2-|html|:root|::view-transition|body\.tv2-lock|\.tv2)/.test(s); }));
        assert.deepStrictEqual(bare, []);
    });

    console.log(`\nTổng ok: ${pass}, lỗi: ${failN}`);
    server.close(); process.exit(failN ? 1 : 0);
})();
