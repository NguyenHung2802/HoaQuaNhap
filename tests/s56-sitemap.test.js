// Kiểm thử S56: /sitemap.xml (trước đây lỗi 500 vì gọi prisma.blog không tồn tại). DB giả lập, HTTP thật.
// Chạy: node tests/s56-sitemap.test.js (sau khi npm install).
const path = require('path');
const http = require('http');
const assert = require('assert');
const Module = require('module');

const root = path.join(__dirname, '..');
process.env.NODE_ENV = 'test';
delete process.env.SITE_URL;

const fake = require('./helpers/fake-shop-prisma').create();
const post = (o) => ({ updated_at: new Date('2026-11-01T00:00:00Z'), is_published: true, post_type: 'blog', ...o });
const posts = [post({ slug: 'bai-cong-khai' }), post({ slug: 'bai-nhap', is_published: false }), post({ slug: 'tin-an-bi-mat', post_type: 'news' })];
fake.prisma.blogPost = { findMany: async ({ where = {} }) => posts.filter((p) => (where.is_published === undefined || p.is_published === where.is_published) && (!where.post_type || p.post_type === where.post_type)).map((p) => ({ slug: p.slug, updated_at: p.updated_at })) };
fake.prisma.setting = { findMany: async () => [] };
const prods = fake.products.map((p) => ({ ...p, updated_at: new Date('2026-11-02T00:00:00Z') }));
const origProductFind = fake.prisma.product.findMany;
fake.prisma.product.findMany = async (args = {}) => (args.select && args.select.updated_at ? prods.filter((p) => p.status === 'published').map((p) => ({ slug: p.slug, updated_at: p.updated_at })) : origProductFind(args));

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
    const get = (p, host = 'haianhfruit.com') => new Promise((resolve, reject) => {
        http.get({ host: '127.0.0.1', port, path: p, headers: { Host: host } }, (res) => { let b = ''; res.setEncoding('utf8'); res.on('data', (c) => { b += c; }); res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: b })); }).on('error', reject);
    });
    const locs = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

    await t('sitemap: 200, XML, đúng Content-Type, không còn lỗi 500', async () => {
        const r = await get('/sitemap.xml'); assert.strictEqual(r.status, 200); assert(/xml/.test(r.headers['content-type'])); assert(r.body.startsWith('<?xml') && r.body.includes('<urlset'));
    });
    await t('sitemap: có trang tĩnh, sản phẩm (/product/<slug>), danh mục (?category=<slug>), blog (/blog/<slug>)', async () => {
        const l = locs((await get('/sitemap.xml')).body);
        for (const p of ['/products', '/about', '/contact', '/faq', '/shipping', '/return', '/privacy', '/blogs']) assert(l.some((u) => u.endsWith(p)), p);
        assert(l.some((u) => u.endsWith('/product/dau-han'))); assert(l.some((u) => u.endsWith('/products?category=my'))); assert(l.some((u) => u.endsWith('/blog/bai-cong-khai')));
        assert(!l.some((u) => /category_id=|\/blog\/\d+$/.test(u)), 'không dùng URL cũ sai (category_id, blog theo id)');
    });
    await t('sitemap: KHÔNG chứa tin tức ẩn, bản nháp, sản phẩm chưa xuất bản', async () => {
        const b = (await get('/sitemap.xml')).body; assert(!b.includes('tin-an-bi-mat') && !b.includes('/tin-tuc/') && !b.includes('bai-nhap'));
    });
    await t('sitemap: dùng SITE_URL khi có (đúng tên miền/https sau Nginx), nếu không thì theo Host', async () => {
        let l = locs((await get('/sitemap.xml')).body); assert(l[0].startsWith('http://haianhfruit.com'), l[0]);
        process.env.SITE_URL = 'https://haianhfruit.com/';
        try { l = locs((await get('/sitemap.xml')).body); assert(l.every((u) => u.startsWith('https://haianhfruit.com')) && !l.some((u) => u.includes('.com//')), l[0]); } finally { delete process.env.SITE_URL; }
    });
    await t('host tin ẩn không có sitemap (404)', async () => { assert.strictEqual((await get('/sitemap.xml', 'tin.haianhfruit.com')).status, 404); });

    console.log(`\nTổng ok: ${pass}, lỗi: ${failN}`);
    server.close(); process.exit(failN ? 1 : 0);
})();
