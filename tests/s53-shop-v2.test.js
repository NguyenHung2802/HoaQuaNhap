// Kiểm thử S53: trang shop và chi tiết sản phẩm giao diện v2 (và classic không đổi). DB giả lập, HTTP thật.
// Chạy: node tests/s53-shop-v2.test.js (sau khi npm install).
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
const count = (s, re) => (s.match(re) || []).length;

(async () => {
    const server = app.listen(0);
    const port = server.address().port;
    const get = (p, headers = {}) => new Promise((resolve, reject) => {
        http.get({ host: '127.0.0.1', port, path: p, headers: { Host: 'haianhfruit.com', ...headers } }, (res) => { let b = ''; res.setEncoding('utf8'); res.on('data', (c) => { b += c; }); res.on('end', () => resolve({ status: res.statusCode, body: b })); }).on('error', reject);
    });
    const names = (h) => [...h.matchAll(/<h5 class="fruit-card-name">([^<]+)<\/h5>/g)].map((m) => m[1]);

    await t('shop v2: có mốc cho JS (shopSidebarCol/shopSidebar/shopResults), CSS và JS v2', async () => {
        const r = await get('/products'); assert.strictEqual(r.status, 200); const h = r.body;
        for (const w of ['id="shopSidebarCol"', 'id="shopSidebar"', 'id="shopResults"', 'id="filterForm"', 'id="sortForm"', '/css/shop-v2.css?v=s53', '/js/shop-v2.js?v=s53']) assert(h.includes(w), w);
        assert.strictEqual(names(h).length, 12, 'trang 1 có 12 sản phẩm');
    });
    await t('shop v2: nút thêm nhanh chỉ có ở sản phẩm còn hàng và gọi addToCart đúng id', async () => {
        const h = (await get('/products')).body; const inStock = fake.products.slice(0, 12).filter((p) => p.stock_quantity > 0);
        assert.strictEqual(count(h, /class="fruit-quick-add"/g), inStock.length);
        inStock.forEach((p) => assert(h.includes(`addToCart(${p.id}, 1)`), 'thiếu id ' + p.id));
        assert(!h.includes('addToCart(7, 1)'), 'Lê Hàn Quốc hết hàng không có nút thêm nhanh');
    });
    await t('shop classic: không có nút thêm nhanh, không nạp CSS/JS v2 (giữ nguyên bản cũ)', async () => {
        process.env.UI_THEME = 'classic';
        try { const h = (await get('/products')).body; for (const w of ['fruit-quick-add"', 'shop-v2', 'theme-v2']) assert(!h.includes(w.replace('"', '')) || w === 'fruit-quick-add"' && !h.includes('class="fruit-quick-add"'), 'còn: ' + w); assert(h.includes('id="shopResults"') && names(h).length === 12); }
        finally { delete process.env.UI_THEME; }
    });

    // Các URL mà JS sẽ gọi qua fetch phải trả về đúng vùng cần thay
    await t('AJAX lọc theo danh mục: trả về đủ vùng kết quả + sidebar với trạng thái đang chọn', async () => {
        const r = await get('/products?category=uc', { 'X-Requested-With': 'tv2-shop' }); assert.strictEqual(r.status, 200); const h = r.body;
        assert.deepStrictEqual(names(h).sort(), ['Cam Navel Úc', 'Cherry Úc', 'Xoài Cát Hòa Lộc', 'Xoài Úc R2E2'].sort()); assert(h.includes('id="shopResults"') && h.includes('id="shopSidebar"'));
        assert(/cat-filter-item[^"]*active[^>]*>\s*<input type="radio" name="category" value="uc"[^>]*checked/.test(h), 'danh mục Úc phải ở trạng thái đang chọn');
    });
    await t('AJAX tìm kiếm / giảm giá / sắp xếp / còn hàng', async () => {
        assert.deepStrictEqual(names((await get('/products?q=' + encodeURIComponent('dâu'))).body).sort(), ['Dâu Hàn Quốc', 'Dâu Nhật Bản']);
        assert.strictEqual(names((await get('/products?status=on_sale')).body).length, 3);
        assert(!names((await get('/products?status=in_stock')).body).includes('Lê Hàn Quốc'));
        const asc = names((await get('/products?sort=price_asc')).body); assert.strictEqual(asc[0], 'Xoài Cát Hòa Lộc');
        const desc = names((await get('/products?sort=price_desc')).body); assert.strictEqual(desc[0], 'Dâu Nhật Bản');
        assert.deepStrictEqual(names((await get('/products?minPrice=400000')).body).sort(), ['Cherry Úc', 'Dâu Nhật Bản']);
        assert.deepStrictEqual(names((await get('/products?origin=Chile&origin=Nh%E1%BA%ADt%20B%E1%BA%A3n')).body).sort(), ['Dâu Nhật Bản', 'Nho đỏ Chile', 'Táo Fuji']);
    });
    await t('không có kết quả: thông báo rỗng vẫn nằm trong vùng thay thế', async () => {
        const h = (await get('/products?q=khongco')).body; assert(h.includes('Không tìm thấy sản phẩm nào')); const res = h.slice(h.indexOf('id="shopResults"')); assert(res.includes('Không tìm thấy sản phẩm nào'));
    });
    await t('phân trang: liên kết dạng ?...page=N (JS chuyển thành /products?...) và trang 2 có 2 sản phẩm', async () => {
        const h = (await get('/products')).body; assert(/href="\?sort=newest&amp;page=2"/.test(h)); const p2 = (await get('/products?sort=newest&page=2')).body; assert.strictEqual(names(p2).length, 2);
    });
    await t('chi tiết v2: nạp CSS/JS v2, giữ nguyên nút thêm vào giỏ gốc (JS thanh mua dính dựa vào nút này)', async () => {
        const r = await get('/product/dau-han'); assert.strictEqual(r.status, 200); const h = r.body;
        for (const w of ['/css/shop-v2.css?v=s53', '/js/product-v2.js?v=s53', 'class="detail-title', 'detail-price-sale', 'class="qty-control"', 'mainSwiper', 'thumbSwiper']) assert(h.includes(w), w);
        assert(/<button class="btn btn-primary rounded-pill px-5 flex-grow-1" onclick="addToCart\(1, document\.getElementById\('qty'\)\.value\)"\s*>/.test(h), 'nút gốc phải bắt đầu bằng onclick="addToCart(');
    });
    await t('chi tiết: sản phẩm hết hàng có nút thêm vào giỏ bị vô hiệu (thanh mua dính sẽ không hiện)', async () => {
        const h = (await get('/product/le-han')).body; assert(/onclick="addToCart\(7,[^>]*disabled/.test(h.replace(/\s+/g, ' ')));
    });
    await t('chi tiết classic: không nạp CSS/JS v2', async () => {
        process.env.UI_THEME = 'classic';
        try { const h = (await get('/product/dau-han')).body; assert(!h.includes('shop-v2.css') && !h.includes('product-v2.js') && h.includes('detail-title')); } finally { delete process.env.UI_THEME; }
    });
    await t('sản phẩm không tồn tại: 404, không lỗi 500', async () => { const r = await get('/product/khong-co'); assert.strictEqual(r.status, 404); });

    await t('shop-v2.css: mọi quy tắc nằm dưới body.theme-v2 hoặc #tv2-; có giảm chuyển động', async () => {
        const css = fs.readFileSync(path.join(root, 'public/css/shop-v2.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
        const bad = css.split('}').map((b) => b.split('{')[0].trim()).filter((sel) => sel && !/^@|^from|^to|^[\d.]+%/.test(sel)).filter((sel) => sel.split(',').some((s) => s.trim() && !/^(body\.theme-v2|#tv2-)/.test(s.trim())));
        assert.deepStrictEqual(bad, []); assert(/prefers-reduced-motion/.test(css));
    });
    await t('shop-v2.js: có dự phòng tải trang đầy đủ khi lỗi, bỏ qua yêu cầu cũ, bỏ qua phím bổ trợ, hủy yêu cầu đang chạy', async () => {
        const src = fs.readFileSync(path.join(root, 'public/js/shop-v2.js'), 'utf8'); new Function(src);
        for (const w of ['window.location.href = url', 'AbortError', 'mine !== seq', 'e.metaKey', 'controller.abort()', "removeAttribute(a.name)", 'popstate', 'pushState']) assert(src.includes(w), w);
    });
    await t('product-v2.js: chỉ kích hoạt nút gốc, không tự thêm logic giỏ hàng; bỏ qua khi nút bị vô hiệu', async () => {
        const src = fs.readFileSync(path.join(root, 'public/js/product-v2.js'), 'utf8'); new Function(src);
        assert(src.includes('mainBtn.click()') && src.includes('mainBtn.disabled') && !/fetch\(/.test(src));
    });

    console.log(`\nTổng ok: ${pass}, lỗi: ${failN}`);
    server.close(); process.exit(failN ? 1 : 0);
})();
