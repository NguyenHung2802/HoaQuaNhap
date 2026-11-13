// Kiểm thử S48: mục lục, liên quan, SEO/chia sẻ của trang bài viết blog công khai.
// DB giả lập trong bộ nhớ, gọi HTTP thật vào ứng dụng (render đủ layout web chính).
// Chạy: node tests/s48-article.test.js (sau khi npm install).
const path = require('path');
const http = require('http');
const assert = require('assert');
const Module = require('module');

const root = path.join(__dirname, '..');
process.env.NODE_ENV = 'test';
process.env.SITE_URL = 'https://haianhfruit.com';

const mk = (o) => ({ is_published: true, post_type: 'blog', summary: null, thumbnail_url: null, tags: null, gallery: null, video_url: null, seo_title: null, seo_description: null, created_at: new Date('2026-11-01T03:00:00Z'), updated_at: new Date('2026-11-02T03:00:00Z'), published_at: null, author: { full_name: 'Admin' }, ...o });
const EVIL = '<img src=x onerror=alert(1)>"><script>alert(2)</script>';
const db = { posts: [
    mk({ id: 1, title: 'Cách chọn nho Mỹ ngon', slug: 'chon-nho-my', tags: 'nho my, meo hay', summary: 'Tóm tắt nho', thumbnail_url: 'https://res.cloudinary.com/demo/image/upload/v1/c.jpg',
         gallery: ['https://res.cloudinary.com/demo/image/upload/v1/g1.jpg'], video_url: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', published_at: new Date('2026-11-01T03:00:00Z'),
         content: '<p>Mở đầu</p><h2>Chọn chùm nho</h2><p>a</p><h3>Màu sắc</h3><p>b</p><h2>Chọn chùm nho</h2><p>c</p><h2 id="cu">Bảo quản</h2><img src="https://x.com/a.jpg"><img loading="eager" src="https://x.com/b.jpg">' }),
    mk({ id: 2, title: 'Bảo quản nho trong tủ lạnh', slug: 'bao-quan-nho', tags: 'nho my', summary: 'S2', content: '<p>x</p>' }),
    mk({ id: 3, title: 'Tin xoài Úc vào mùa', slug: 'xoai-uc', tags: 'xoai', content: '<p>x</p>' }),
    mk({ id: 4, title: 'Bài nháp', slug: 'bai-nhap', is_published: false, content: '<p>x</p>' }),
    mk({ id: 5, title: 'Tin ẩn', slug: 'tin-an', post_type: 'news', content: '<p>x</p>' }),
    mk({ id: 6, title: 'Bài ngắn', slug: 'bai-ngan', content: '<p>x</p><h2>Một</h2><h2>Hai</h2>' }),
    mk({ id: 7, title: EVIL, slug: 'bai-doc', summary: EVIL, tags: EVIL, content: '<p>x</p>' })
], products: [
    { id: 10, name: 'Nho Mỹ không hạt', slug: 'nho-my', status: 'published', price: 169000, sale_price: null, is_best_seller: false, is_featured: false, unit: 'kg', origin_country: 'Mỹ', images: [{ image_url: 'https://x.com/p10.jpg' }], categories: [], created_at: new Date('2026-01-01') },
    { id: 11, name: 'Xoài Úc R2E2', slug: 'xoai', status: 'published', price: 99000, sale_price: 89000, is_best_seller: true, is_featured: false, unit: 'kg', origin_country: 'Úc', images: [], categories: [], created_at: new Date('2026-01-02') },
    { id: 12, name: 'Dâu Hàn Quốc', slug: 'dau', status: 'published', price: 289000, sale_price: null, is_best_seller: false, is_featured: true, unit: 'hộp', origin_country: 'Hàn Quốc', images: [], categories: [], created_at: new Date('2026-01-03') },
    { id: 13, name: 'Cherry Úc', slug: 'cherry', status: 'draft', price: 459000, sale_price: null, is_best_seller: true, images: [], categories: [], created_at: new Date('2026-01-04') }
], productQueries: 0, failProducts: false };

const sel = (row, select) => (select ? Object.fromEntries(Object.keys(select).map((k) => [k, row[k]])) : row);
const fakePrisma = {
    category: { findMany: async () => [] },
    setting: { findMany: async () => [] },
    promotionCampaign: { findMany: async () => [] },
    blogPost: {
        findUnique: async ({ where }) => db.posts.find((p) => where.slug ? p.slug === where.slug : p.id === where.id) || null,
        findMany: async ({ where = {}, take = 100, select }) => db.posts
            .filter((p) => (where.is_published === undefined || p.is_published === where.is_published) && (!where.post_type || p.post_type === where.post_type) && (!where.id || !where.id.not || p.id !== where.id.not))
            .sort((a, b) => b.created_at - a.created_at || b.id - a.id).slice(0, take).map((p) => sel(p, select)),
        count: async () => db.posts.length
    },
    product: {
        findMany: async ({ where = {}, select, take }) => {
            db.productQueries++;
            if (db.failProducts) throw new Error('DB down');
            let rows = db.products.filter((p) => (!where.status || p.status === where.status));
            if (where.id && where.id.in) rows = rows.filter((p) => where.id.in.includes(p.id));
            if (where.id && where.id.notIn) rows = rows.filter((p) => !where.id.notIn.includes(p.id));
            if (where.OR) rows = rows.filter((p) => where.OR.some((c) => Object.entries(c).every(([k, v]) => p[k] === v)));
            rows = rows.sort((a, b) => b.created_at - a.created_at);
            if (take) rows = rows.slice(0, take);
            return rows.map((p) => sel(p, select));
        }
    }
};
const origLoad = Module._load;
Module._load = function (request) {
    if (request === '@prisma/client') return { PrismaClient: function () { return fakePrisma; } };
    return origLoad.apply(this, arguments);
};

const article = require(path.join(root, 'src/modules/posts/article.service.js'));
const app = require(path.join(root, 'src/app.js'));

let pass = 0, failN = 0;
const t = async (name, fn) => { try { await fn(); pass++; console.log('ok  ', name); } catch (e) { failN++; console.log('FAIL', name, '\n    ', e.message); } };

(async () => {
    const server = app.listen(0);
    const port = server.address().port;
    const get = (p, host = 'haianhfruit.com') => new Promise((resolve, reject) => {
        http.get({ host: '127.0.0.1', port, path: p, headers: { Host: host } }, (res) => { let b = ''; res.setEncoding('utf8'); res.on('data', (c) => { b += c; }); res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: b })); }).on('error', reject);
    });

    /* --- Đơn vị: enhanceArticle --- */
    await t('mục lục: gắn id cho h2/h3, id trùng được đánh số, id cũ bị thay bằng id sạch', async () => {
        const r = article.enhanceArticle(db.posts[0].content);
        assert.deepStrictEqual(r.toc.map((h) => h.id), ['chon-chum-nho', 'mau-sac', 'chon-chum-nho-2', 'bao-quan']);
        assert.deepStrictEqual(r.toc.map((h) => h.level), [2, 3, 2, 2]);
        assert(r.html.includes('<h2 id="chon-chum-nho">Chọn chùm nho</h2>') && r.html.includes('<h2 id="bao-quan">Bảo quản</h2>'));
        assert(!r.html.includes('id="cu"'));
    });
    await t('ảnh được thêm loading=lazy, ảnh đã có loading giữ nguyên', async () => {
        const html = article.enhanceArticle(db.posts[0].content).html;
        assert(html.includes('<img loading="lazy" src="https://x.com/a.jpg">') && html.includes('<img loading="eager" src="https://x.com/b.jpg">'));
        assert(!/loading="lazy"[^>]*loading=/.test(html));
    });
    await t('tiêu đề rỗng / có thẻ con vẫn xử lý đúng', async () => {
        const r = article.enhanceArticle('<h2></h2><h2><strong>Đậm</strong> và <em>nghiêng</em></h2>');
        assert.strictEqual(r.toc.length, 1); assert.strictEqual(r.toc[0].text, 'Đậm và nghiêng'); assert(r.html.includes('<h2></h2>'));
    });
    await t('từ khóa: từ thẻ và tiêu đề, bỏ từ dừng', async () => {
        const k = article.keywordsOf({ tags: 'Nho Mỹ, mẹo hay', title: 'Cách chọn nho ngon cho gia đình' });
        assert(k.includes('nho-my') && k.includes('nho') && k.includes('chon') && k.includes('ngon')); assert(!k.includes('cach') && !k.includes('cho'));
    });

    /* --- Đơn vị: liên quan --- */
    await t('bài liên quan: ưu tiên trùng thẻ, loại bài nháp/tin ẩn/chính nó', async () => {
        const rel = await article.findRelatedPosts(db.posts[0], 3);
        assert.strictEqual(rel[0].slug, 'bao-quan-nho'); assert(!rel.some((r) => ['bai-nhap', 'tin-an', 'chon-nho-my'].includes(r.slug))); assert(rel.length === 3);
    });
    await t('sản phẩm liên quan: khớp tên theo từ khóa, bổ sung bán chạy/nổi bật, bỏ sản phẩm nháp', async () => {
        article._resetProductIndex();
        const p = await article.findRelatedProducts(db.posts[0], 4);
        assert.strictEqual(p[0].name, 'Nho Mỹ không hạt'); assert(p.some((x) => x.name === 'Xoài Úc R2E2') && p.some((x) => x.name === 'Dâu Hàn Quốc'));
        assert(!p.some((x) => x.status === 'draft')); assert.strictEqual(p[0].bestPrice, 169000); assert(typeof p[0].discountPercent === 'number');
        assert.strictEqual(p.find((x) => x.name === 'Xoài Úc R2E2').bestPrice, 89000, 'giá khuyến mãi phải được tính');
    });
    await t('chỉ mục sản phẩm được cache (lần sau không truy vấn lại danh sách tên)', async () => {
        const before = db.productQueries; await article.findRelatedProducts(db.posts[0], 4);
        assert(db.productQueries - before <= 2, 'queries=' + (db.productQueries - before));
    });

    /* --- HTTP --- */
    await t('trang bài: 200, canonical, Open Graph, JSON-LD hợp lệ', async () => {
        const r = await get('/blog/chon-nho-my'); assert.strictEqual(r.status, 200);
        assert(r.body.includes('<link rel="canonical" href="https://haianhfruit.com/blog/chon-nho-my">'));
        for (const m of ['property="og:type" content="article"', 'property="og:title" content="Cách chọn nho Mỹ ngon"', 'property="og:url" content="https://haianhfruit.com/blog/chon-nho-my"', 'name="twitter:card" content="summary_large_image"', 'property="article:published_time" content="2026-11-01T03:00:00.000Z"', 'property="article:tag" content="nho my"', 'f_auto,q_auto,w_1200']) assert(r.body.includes(m), m);
        assert(r.body.includes('<meta name="description" content="Tóm tắt nho">'));
        const ld = JSON.parse(r.body.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
        assert.strictEqual(ld['@type'], 'BlogPosting'); assert.strictEqual(ld.headline, 'Cách chọn nho Mỹ ngon'); assert.strictEqual(ld.author.name, 'Admin'); assert.strictEqual(ld.mainEntityOfPage, 'https://haianhfruit.com/blog/chon-nho-my');
    });
    await t('trang bài: mục lục (sidebar + di động), neo id, thời gian đọc, video, gallery', async () => {
        const r = await get('/blog/chon-nho-my');
        assert(r.body.includes('id="toc"') && r.body.includes('data-target="chon-chum-nho-2"') && r.body.includes('blog-toc-mobile'));
        assert(r.body.includes('<h2 id="mau-sac">') === false && r.body.includes('<h3 id="mau-sac">Màu sắc</h3>'));
        assert(/\d+ phút đọc/.test(r.body)); assert(r.body.includes('youtube-nocookie.com/embed/dQw4w9WgXcQ')); assert(r.body.includes('data-full="https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_1600/'));
        assert(r.body.includes('#nho my') === true && !r.body.includes('#tráicây'), 'thẻ lấy từ dữ liệu, không còn thẻ cứng');
    });
    await t('trang bài: nút chia sẻ thật (Facebook, X, sao chép) trỏ về URL bài', async () => {
        const r = await get('/blog/chon-nho-my');
        assert(r.body.includes('https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fhaianhfruit.com%2Fblog%2Fchon-nho-my'));
        assert(r.body.includes('https://twitter.com/intent/tweet?url=https%3A%2F%2Fhaianhfruit.com%2Fblog%2Fchon-nho-my')); assert(r.body.includes('id="copy-link"') && r.body.includes('id="native-share"'));
        assert(!r.body.includes('profile.php?id=61592738625329" target="_blank" rel="noopener noreferrer" aria-label="Twitter"'), 'không còn nút chia sẻ trỏ nhầm về trang Facebook');
    });
    await t('trang bài: có khối sản phẩm liên quan và bài viết liên quan', async () => {
        const r = await get('/blog/chon-nho-my');
        assert(r.body.includes('Sản phẩm liên quan') && r.body.includes('/product/nho-my') && r.body.includes('Nho Mỹ không hạt')); assert(!r.body.includes('/product/cherry'));
        assert(r.body.includes('Bài viết liên quan') && r.body.includes('/blog/bao-quan-nho'));
    });
    await t('lỗi truy vấn sản phẩm liên quan không làm hỏng trang bài', async () => {
        article._resetProductIndex(); db.failProducts = true; const r = await get('/blog/chon-nho-my'); db.failProducts = false;
        assert.strictEqual(r.status, 200); assert(!r.body.includes('Sản phẩm liên quan')); assert(r.body.includes('Cách chọn nho Mỹ ngon'));
    });
    await t('bài ngắn (<3 mục) không hiện mục lục', async () => { const r = await get('/blog/bai-ngan'); assert.strictEqual(r.status, 200); assert(!r.body.includes('id="toc"') && !r.body.includes('<details class="blog-toc-mobile')); });
    await t('SEO tùy chỉnh: seo_title / seo_description ưu tiên', async () => {
        db.posts[1].seo_title = 'Tiêu đề SEO riêng'; db.posts[1].seo_description = 'Mô tả SEO riêng';
        const r = await get('/blog/bao-quan-nho'); assert(r.body.includes('<title>Tiêu đề SEO riêng |')); assert(r.body.includes('content="Mô tả SEO riêng"'));
    });
    await t('chống chèn mã qua tiêu đề/tóm tắt/thẻ trong <head>', async () => {
        const r = await get('/blog/bai-doc'); assert.strictEqual(r.status, 200);
        const head = r.body.slice(0, r.body.indexOf('</head>'));
        assert(!/<img src=x onerror/.test(head) && !head.includes('<script>alert(2)'), 'head bị chèn mã');
        const ld = head.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]; assert(!/[<>&]/.test(ld)); assert.strictEqual(JSON.parse(ld).headline, EVIL);
    });
    await t('tin ẩn và bản nháp vẫn 404 ở /blog/:slug', async () => { assert.strictEqual((await get('/blog/tin-an')).status, 404); assert.strictEqual((await get('/blog/bai-nhap')).status, 404); assert.strictEqual((await get('/blog/khong-co')).status, 404); });
    await t('trang danh sách blog có mô tả và canonical', async () => {
        const r = await get('/blogs'); assert.strictEqual(r.status, 200); assert(r.body.includes('<link rel="canonical" href="https://haianhfruit.com/blogs">') && r.body.includes('Mẹo chọn mua, bảo quản'));
    });

    console.log(`\nTổng ok: ${pass}, lỗi: ${failN}`);
    server.close(); process.exit(failN ? 1 : 0);
})();
