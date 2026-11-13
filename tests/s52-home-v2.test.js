// Kiểm thử S52: trang chủ giao diện v2 (hero editorial) và bản classic không đổi. DB giả lập, HTTP thật.
// Chạy: node tests/s52-home-v2.test.js (sau khi npm install).
const path = require('path');
const fs = require('fs');
const http = require('http');
const assert = require('assert');
const Module = require('module');

const root = path.join(__dirname, '..');
process.env.NODE_ENV = 'test';
delete process.env.UI_THEME;

const EVIL = '<img src=x onerror=alert(1)> & "q"';
const mkProduct = (o) => ({ status: 'published', price: 100000, sale_price: null, is_flash_sale: false, flash_sale_price: null, flash_sale_end: null, stock_quantity: 5, unit: 'kg', origin_country: 'Mỹ', category_id: 1, categories: [], images: [{ image_url: 'https://x.com/p.jpg', is_thumbnail: true }], created_at: new Date(), ...o });
const db = { banners: [], failBanners: false,
    featured: [mkProduct({ id: 1, name: 'Táo Envy', slug: 'tao-envy', is_featured: true }), mkProduct({ id: 2, name: 'Nho Mỹ', slug: 'nho-my', is_featured: true, is_best_seller: true })],
    flash: [mkProduct({ id: 3, name: 'Cherry Úc', slug: 'cherry', is_flash_sale: true, flash_sale_price: 300000, price: 450000, flash_sale_end: new Date(Date.now() + 3600000) })],
    cats: [{ id: 1, name: 'Trái cây Mỹ', slug: 'my', is_active: true, parent_id: null, sort_order: 1, image_url: null }],
    blogs: [{ id: 1, title: 'Cách chọn nho', slug: 'chon-nho', summary: 'Mẹo', thumbnail_url: null, created_at: new Date() }] };
const fakePrisma = {
    category: { findMany: async () => db.cats },
    promotionCampaign: { findMany: async () => [] },
    banner: { findMany: async () => { if (db.failBanners) throw new Error('DB down'); return db.banners; } },
    blogPost: { findMany: async () => db.blogs },
    product: { findMany: async ({ where = {} } = {}) => (where.is_flash_sale ? db.flash : where.is_featured ? db.featured : where.is_best_seller ? [db.featured[1]] : []) }
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
    const home = () => new Promise((resolve, reject) => {
        http.get({ host: '127.0.0.1', port, path: '/', headers: { Host: 'haianhfruit.com' } }, (res) => { let b = ''; res.setEncoding('utf8'); res.on('data', (c) => { b += c; }); res.on('end', () => resolve({ status: res.statusCode, body: b })); }).on('error', reject);
    });
    const heroOf = (h) => h.slice(h.indexOf('<section class="hv2-hero"'), h.indexOf('</section>', h.indexOf('<section class="hv2-hero"')));

    await t('v2 + banner admin: hero editorial dùng đúng dữ liệu banner, 1 thẻ h1', async () => {
        db.banners = [{ id: 1, title: 'Nho Mỹ vào vụ', subtitle: 'Giá tốt nhất năm', image_url: 'https://cdn.x.com/b1.jpg', link_url: '/products?category=nho' }, { id: 2, title: 'Quà biếu', subtitle: null, image_url: 'https://cdn.x.com/b2.jpg', link_url: null }];
        const r = await home(); assert.strictEqual(r.status, 200); const hero = heroOf(r.body);
        assert(r.body.includes('/css/home-v2.css?v=s52')); assert(hero.includes('heroSwiper') && hero.includes('swiper-pagination') && hero.includes('swiper-button-next') && hero.includes('swiper-button-prev'));
        assert.strictEqual((hero.match(/class="swiper-slide"/g) || []).length, 2);
        assert(/<h1 class="hv2-title">\s*Nho Mỹ vào vụ\s*<\/h1>/.test(hero)); assert(/<h2 class="hv2-title">\s*Quà biếu\s*<\/h2>/.test(hero)); assert.strictEqual((hero.match(/<h1/g) || []).length, 1);
        assert(hero.includes('Giá tốt nhất năm')); assert(hero.includes('src="https://cdn.x.com/b1.jpg"') && hero.includes('src="https://cdn.x.com/b2.jpg"'));
        assert(/href="\/products\?category=nho" class="btn btn-primary btn-lg px-5">Khám phá ngay/.test(hero)); assert(/href="\/products" class="btn btn-primary btn-lg px-5">Mua sắm ngay/.test(hero));
        assert(/fetchpriority="high"/.test(hero) && (hero.match(/fetchpriority="low"/g) || []).length === 1 && !/loading="lazy"/.test(hero), 'ảnh đầu ưu tiên tải; ảnh sau tải nền ưu tiên thấp (không lazy để tránh khung trống khi tự chuyển slide)');
    });
    await t('hero v2: tiêu đề/mô tả banner được escape (chống chèn mã)', async () => {
        db.banners = [{ id: 1, title: EVIL, subtitle: EVIL, image_url: 'https://cdn.x.com/b.jpg', link_url: null }];
        const hero = heroOf((await home()).body);
        assert(!/<img src=x onerror/.test(hero)); assert(hero.includes('&lt;img src=x onerror=alert(1)&gt; &amp; &#34;q&#34;') || hero.includes('&lt;img src=x onerror=alert(1)&gt; &amp; &quot;q&quot;'));
    });
    await t('chưa có banner: 3 slide mặc định, từ khóa nhấn mạnh in nghiêng, có liên kết phụ', async () => {
        db.banners = []; const hero = heroOf((await home()).body);
        assert.strictEqual((hero.match(/class="swiper-slide"/g) || []).length, 3); assert(hero.includes('<em>Nhập Khẩu</em>') && hero.includes('<em>Trái Cây</em>') && hero.includes('<em>Từ Thiên Nhiên</em>'));
        assert(hero.includes('Xem ưu đãi') && hero.includes('Tư vấn miễn phí') && hero.includes('Về chúng tôi'));
        assert(hero.includes('Giao nội thành'), 'huy hiệu giao hàng (thông tin có thật ở thanh tin cậy)');
    });
    await t('mọi khối còn lại của trang chủ vẫn có đủ dữ liệu (v2)', async () => {
        const h = (await home()).body;
        for (const w of ['trust-bar-section', 'id="categories"', 'Trái cây Mỹ', 'flash-sale-section', 'data-countdown=', 'cd-hours', 'Cherry Úc', 'Táo Envy', 'Nho Mỹ', 'Lý Do Người Tiêu Dùng', 'testimonial-card', 'Cách chọn nho']) assert(h.includes(w), w);
        assert(h.includes("new Swiper('.heroSwiper'") && h.includes('.countdown-timer'), 'script Swiper và đếm ngược còn nguyên');
        assert(!h.includes('class="combo-card"') && !h.includes('Combo Buổi Sáng'),'v2 không còn khối combo cũ (ảnh stock, nội dung viết cứng); thay bằng bộ sưu tập theo danh mục thật'); assert.strictEqual((h.match(/class="why-card"/g) || []).length, 4);
    });
    await t('lỗi DB ở trang chủ: vẫn hiển thị (hero mặc định), không 500', async () => {
        db.failBanners = true; const r = await home(); db.failBanners = false;
        assert.strictEqual(r.status, 200); assert(r.body.includes('hv2-hero') && r.body.includes('Tinh Hoa'));
    });

    await t('classic: hero cũ giữ nguyên, không có bất kỳ phần nào của hero v2', async () => {
        process.env.UI_THEME = 'classic';
        try {
            db.banners = [{ id: 1, title: 'Banner cũ', subtitle: 'Mô tả', image_url: 'https://cdn.x.com/b1.jpg', link_url: '/products' }];
            const h = (await home()).body;
            assert(h.includes('<section class="hero-slider-section">') && h.includes('class="hero-slide-item"') && h.includes('animate__fadeInUp') && h.includes('Banner cũ') && h.includes('Khám phá ngay'));
            for (const w of ['hv2-', 'home-v2.css', 'theme-v2']) assert(!h.includes(w), 'còn: ' + w);
            db.banners = []; const h2 = (await home()).body; assert(h2.includes('Tinh Hoa') && h2.includes('hero-title-accent') && h2.includes('Mua sắm ngay'));
        } finally { delete process.env.UI_THEME; }
    });

    await t('home-v2.css: mọi quy tắc nằm dưới body.theme-v2; không dùng :has; chỉ ẩn nội dung hero khi Swiper đã khởi tạo; có giảm chuyển động', async () => {
        const raw = fs.readFileSync(path.join(root, 'public/css/home-v2.css'), 'utf8'); const css = raw.replace(/\/\*[\s\S]*?\*\//g, '');
        const bad = css.split('}').map((b) => b.split('{')[0].trim()).filter((sel) => sel && !/^@|^from|^to|^\d+%|^[\d.]+%/.test(sel)).filter((sel) => sel.split(',').some((s) => s.trim() && !s.trim().startsWith('body.theme-v2')));
        assert.deepStrictEqual(bad, []); assert(!/:has\(/.test(css));
        const hides = css.split('}').filter((b) => /opacity:\s*0;/.test(b) && /hv2-copy/.test(b)); assert(hides.length >= 1 && hides.every((b) => /swiper-initialized/.test(b)), 'ẩn nội dung hero phải gắn với swiper-initialized');
        assert(/prefers-reduced-motion/.test(css));
    });
    await t('trang chủ v2 và classic cùng nạp style.css trước; home-v2.css nằm sau (ghi đè đúng thứ tự)', async () => {
        db.banners = []; const h = (await home()).body; assert(h.indexOf('/css/style.css') < h.indexOf('/css/theme-v2.css') && h.indexOf('/css/theme-v2.css') < h.indexOf('/css/home-v2.css'));
    });

    console.log(`\nTổng ok: ${pass}, lỗi: ${failN}`);
    server.close(); process.exit(failN ? 1 : 0);
})();
