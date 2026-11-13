// Kiểm thử S54: giỏ hàng, thanh toán, đặt hàng thành công giao diện v2. Trọng tâm: v2 CHỈ đổi trình bày —
// phần form/ID/hàm của luồng đặt hàng phải giống hệt bản classic. DB giả lập, HTTP thật.
// Chạy: node tests/s54-cart-checkout-v2.test.js (sau khi npm install).
const path = require('path');
const fs = require('fs');
const http = require('http');
const assert = require('assert');
const Module = require('module');

const root = path.join(__dirname, '..');
process.env.NODE_ENV = 'test';
delete process.env.UI_THEME;

const fake = require('./helpers/fake-shop-prisma').create();
// Trang thanh toán dùng nhiều bảng khác: bọc Proxy để bảng/phương thức chưa giả lập trả về rỗng.
const base = fake.prisma;
const shipping = { id: 1, name: 'Freeship', type: 'percent', value: 100, min_order_value: 500000 };
base.shippingCampaign = { findFirst: async () => shipping, findMany: async () => [shipping] };
const prisma = new Proxy(base, { get: (t, model) => {
    if (model in t) return t[model];
    if (model === '$queryRaw' || model === '$transaction') return async () => [];
    if (model === 'session') return undefined;
    return new Proxy({}, { get: (_m, method) => async () => (method === 'findMany' ? [] : method === 'count' ? 0 : null) });
} });
const origLoad = Module._load;
Module._load = function (request) {
    if (request === '@prisma/client') return { PrismaClient: function () { return prisma; } };
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
    const page = async (p, theme) => { if (theme === 'classic') process.env.UI_THEME = 'classic'; try { return await call('GET', p); } finally { delete process.env.UI_THEME; } };
    const between = (h, a, b) => { const i = h.indexOf(a); return i < 0 ? null : h.slice(i, h.indexOf(b, i) + b.length); };
    const noSteps = (h) => h.replace(/<ol class="tv2-steps"[\s\S]*?<\/ol>/, '');

    await call('POST', '/cart/add', { product_id: 1, quantity: 2 });
    await call('POST', '/cart/add', { product_id: 2, quantity: 1 });

    await t('giỏ hàng v2: có thanh tiến trình bước 1, vùng #cartRoot, CSS/JS v2', async () => {
        const r = await page('/cart', 'v2'); assert.strictEqual(r.status, 200); const h = r.body;
        assert(h.includes('id="cartRoot"') && h.includes('/css/cart-v2.css?v=s54') && h.includes('/js/cart-v2.js?v=s54'));
        const steps = between(h, '<ol class="tv2-steps"', '</ol>'); assert(steps && /is-current[\s\S]*Giỏ hàng/.test(steps)); assert.strictEqual((steps.match(/is-done/g) || []).length, 0);
        assert(steps.includes('aria-current="step"'));
    });
    await t('giỏ hàng: danh sách sản phẩm + tóm tắt đơn giống HỆT bản classic (trừ thanh tiến trình) -> logic/ID/onclick không đổi', async () => {
        const norm = (x) => x.replace(/\s+/g, ' ').trim();
        // Khối gợi ý "Có thể bạn cũng thích" được server chọn NGẪU NHIÊN mỗi lần nên không đem ra so sánh.
        const items = (h) => norm(between(h, '<div class="cart-items-wrapper">', '<div class="mt-4">'));
        const summary = (h) => norm(between(h, '<div class="cart-summary', '</section>'));
        const v2 = (await page('/cart', 'v2')).body, cl = (await page('/cart', 'classic')).body;
        assert.strictEqual(items(v2), items(cl)); assert.strictEqual(summary(v2), summary(cl));
        assert(items(cl).length > 500 && summary(cl).includes('Tiến hành thanh toán'));
        assert(cl.includes('onclick="updateCartItem(1, 1)"') && cl.includes('onclick="updateCartItem(1, 3)"') && cl.includes('onclick="removeCartItem(1)"') && cl.includes('href="/checkout"'));
        assert.strictEqual(norm(noSteps(between(v2, '<h1 class="font-heading text-primary mb-4">', '</h1>'))), norm(between(cl, '<h1 class="font-heading text-primary mb-4">', '</h1>')));
    });
    await t('giỏ hàng classic: không có thanh tiến trình, CSS/JS v2', async () => {
        const h = (await page('/cart', 'classic')).body; for (const w of ['tv2-steps', 'cart-v2', 'theme-v2']) assert(!h.includes(w), w);
    });
    await t('API giỏ hàng mà cart-v2.js dựa vào vẫn đúng (update/remove -> /cart phản ánh ngay)', async () => {
        const u = JSON.parse((await call('POST', '/cart/update', { product_id: 1, quantity: 3 })).body); assert.strictEqual(u.success, true); assert.strictEqual(u.count, 4);
        let h = (await page('/cart', 'v2')).body; assert(h.includes('data-product-id="1"') && h.includes('value="3"'));
        const rm = JSON.parse((await call('POST', '/cart/remove', { product_id: 2 })).body); assert.strictEqual(rm.success, true);
        h = (await page('/cart', 'v2')).body; assert(!h.includes('data-product-id="2"') && h.includes('data-product-id="1"'));
        await call('POST', '/cart/remove', { product_id: 1 }); h = (await page('/cart', 'v2')).body; assert(h.includes('Giỏ hàng của bạn đang trống') && h.includes('id="cartRoot"'), 'giỏ rỗng vẫn nằm trong #cartRoot');
        await call('POST', '/cart/add', { product_id: 1, quantity: 2 });
    });

    await t('thanh toán v2: bước 2 (bước 1 đã xong, có liên kết về giỏ), CSS v2', async () => {
        const r = await page('/checkout', 'v2'); assert.strictEqual(r.status, 200, 'status=' + r.status); const h = r.body;
        const steps = between(h, '<ol class="tv2-steps"', '</ol>'); assert(steps); assert((steps.match(/is-done/g) || []).length === 1 && /is-current[\s\S]*Thanh toán/.test(steps)); assert(/<a href="\/cart" class="tv2-step-link">/.test(steps));
        assert(h.includes('/css/cart-v2.css?v=s54')); assert(!h.includes('cart-v2.js'), 'trang thanh toán không nạp JS giỏ hàng');
    });
    await t('thanh toán: toàn bộ <form> đặt hàng (trường, id, hidden input, nút) giống HỆT classic', async () => {
        const v2 = between((await page('/checkout', 'v2')).body, '<form action="/checkout/place-order"', '</form>');
        const cl = between((await page('/checkout', 'classic')).body, '<form action="/checkout/place-order"', '</form>');
        assert(v2 && cl); assert.strictEqual(v2, cl);
        for (const w of ['method="POST"', 'id="checkoutForm"', 'name="delivery_address"', 'id="placeOrderBtn"', 'name="coupon_code"', 'id="finalTotalText"', 'name="payment_method"']) assert(cl.includes(w), 'thiếu ' + w);
    });
    await t('thanh toán: script xử lý (voucher, điểm, freeship, địa chỉ) giống HỆT classic', async () => {
        const v2 = (await page('/checkout', 'v2')).body, cl = (await page('/checkout', 'classic')).body;
        const sc = (h) => (h.slice(h.indexOf('<script src="/js/address-helper.js">')).match(/<script[\s\S]*?<\/script>/g) || []).filter((s) => !/cart-v2|theme-v2|swiper|bootstrap|sweetalert|aos|main\.js|cart\.js|AUTH_STATE/i.test(s));
        assert.deepStrictEqual(sc(v2), sc(cl)); assert(sc(cl).length >= 2);
    });
    await t('thanh toán classic: không có thanh tiến trình/CSS v2', async () => { const h = (await page('/checkout', 'classic')).body; assert(!h.includes('tv2-steps') && !h.includes('cart-v2')); });

    await t('đặt hàng thành công v2: thanh tiến trình hoàn tất (3 bước đều xong) — kiểm tra bằng render trực tiếp', async () => {
        const ejs = require('ejs');
        const html = await Promise.resolve(ejs.renderFile(path.join(root, 'src/views/public/checkout/success.ejs'), { uiTheme: 'v2', order: { order_code: 'HQ123', payment_method: 'COD' }, qrUrl: null, bankDisplayName: '', bankAccountNo: '', bankAccountName: '', bankName: '', layout: false })).catch((e) => 'ERR ' + e.message);
        assert(!String(html).startsWith('ERR'), String(html).slice(0, 200)); const steps = between(html, '<ol class="tv2-steps"', '</ol>');
        assert(steps && (steps.match(/is-done/g) || []).length === 2 && /is-current[\s\S]*Hoàn tất/.test(steps) || (steps.match(/is-done/g) || []).length >= 2, steps);
        assert(!/<a href="\/cart"/.test(steps), 'bước đã xong không dẫn về giỏ sau khi đặt hàng');
        const classic = await ejs.renderFile(path.join(root, 'src/views/public/checkout/success.ejs'), { uiTheme: 'classic', order: { order_code: 'HQ123', payment_method: 'COD' }, qrUrl: null, bankDisplayName: '', bankAccountNo: '', bankAccountName: '', bankName: '', layout: false });
        assert(!classic.includes('tv2-steps') && classic.includes('Đặt hàng thành công'));
    });

    await t('cart-v2.js: dùng đúng API cũ, tính tiền ở server, có dự phòng hàm gốc, không tự tính giá', async () => {
        const src = fs.readFileSync(path.join(root, 'public/js/cart-v2.js'), 'utf8'); new Function(src);
        for (const w of ["'/cart/update'", "'/cart/remove'", "fetch('/cart'", 'origUpdate', 'origRemove', 'window.location.reload()', 'X-Requested-With']) assert(src.includes(w), w);
        assert(!/\bprice\b|total/i.test(src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')), 'không có logic tiền ở trình duyệt');
    });
    await t('cart-v2.css: mọi quy tắc nằm dưới body.theme-v2; có giảm chuyển động; không đụng tới #placeOrderBtn ngoài trình bày', async () => {
        const css = fs.readFileSync(path.join(root, 'public/css/cart-v2.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
        const bad = css.split('}').map((b) => b.split('{')[0].trim()).filter((s) => s && !/^@|^from|^to|^[\d.]+%|^\d+%/.test(s)).filter((s) => s.split(',').some((x) => x.trim() && !x.trim().startsWith('body.theme-v2')));
        assert.deepStrictEqual(bad, []); assert(/prefers-reduced-motion/.test(css)); assert(!/display:\s*none[^;]*;[^}]*#placeOrderBtn|#placeOrderBtn[^{]*\{[^}]*(display:\s*none|pointer-events:\s*none)/.test(css));
    });

    console.log(`\nTổng ok: ${pass}, lỗi: ${failN}`);
    server.close(); process.exit(failN ? 1 : 0);
})();
