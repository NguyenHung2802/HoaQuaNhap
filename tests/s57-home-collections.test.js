// Kiểm thử S57: "Bộ sưu tập theo nhu cầu" ở trang chủ lấy dữ liệu thật từ danh mục. Prisma giả lập.
// Chạy: node tests/s57-home-collections.test.js (sau khi npm install).
const path = require('path');
const assert = require('assert');
const Module = require('module');

process.env.NODE_ENV = 'test';
const root = path.join(__dirname, '..');

const cats = [
    { id: 1, slug: 'gio-qua-trai-cay', image_url: 'https://res.cloudinary.com/x/image/upload/v1/admin-cover.jpg', is_active: true },
    { id: 2, slug: 'khay-hop-qua-trai-cay', image_url: null, is_active: true },
    { id: 3, slug: 'thap-qua-qua-di-le', image_url: null, is_active: true },
    { id: 4, slug: 'tao-nhap-khau', image_url: null, is_active: true },
    { id: 5, slug: 'trai-cay-viet-nam', image_url: null, is_active: true }
];
const img = (n) => [{ image_url: `https://res.cloudinary.com/x/image/upload/v1/${n}.jpg` }];
const products = [
    { slug: 'giỏ-1', status: 'published', category_id: 1, price: 900000, sale_price: 850000, images: img('gio1'), created_at: 3 },
    { slug: 'khay-1', status: 'published', category_id: 2, price: 400000, sale_price: null, images: img('khay1'), created_at: 2 },
    { slug: 'khay-2', status: 'published', category_id: 2, price: 300000, sale_price: null, images: img('khay2'), created_at: 1 },
    { slug: 'khay-nhap', status: 'draft', category_id: 2, price: 100000, sale_price: null, images: img('draft'), created_at: 9 },
    { slug: 'tao-1', status: 'published', category_id: 4, price: 200000, sale_price: null, images: img('tao1'), created_at: 5 },
    { slug: 'nho-sua-han-quoc-shine-muscat', status: 'published', category_id: 4, price: 450000, sale_price: null, images: img('nho'), created_at: 4 }
    // danh mục 3 (tháp) và 5 (Việt) không có sản phẩm đã đăng => ô phải bị ẩn
];
const matches = (p, where) => {
    if (where.status && p.status !== where.status) return false;
    if (where.slug && p.slug !== where.slug) return false;
    if (where.OR) {
        const ids = where.OR[0].category_id.in;
        if (!ids.includes(p.category_id)) return false;
    }
    return true;
};
let queries = 0;
const prisma = {
    category: { findMany: async ({ where }) => { queries++; return cats.filter((c) => where.slug.in.includes(c.slug) && c.is_active); } },
    product: {
        count: async ({ where }) => { queries++; return products.filter((p) => matches(p, where)).length; },
        findMany: async ({ where }) => { queries++; return products.filter((p) => matches(p, where)).sort((a, b) => b.created_at - a.created_at); },
        findFirst: async ({ where }) => { queries++; return products.find((p) => matches(p, where)) || null; }
    }
};
const origLoad = Module._load;
Module._load = function (request) {
    if (request === '@prisma/client') return { PrismaClient: function () { return prisma; } };
    return origLoad.apply(this, arguments);
};
const svc = require(path.join(root, 'src/modules/public/home/collections.service.js'));

let pass = 0, failN = 0;
const t = async (name, fn) => { try { await fn(); pass++; console.log('ok  ', name); } catch (e) { failN++; console.log('FAIL', name, '\n    ', e.message); } };

(async () => {
    svc.clearCache();
    const list = await svc.getHomeCollections();
    const by = (k) => list.find((x) => x.key === k);

    await t('chỉ hiện ô có sản phẩm đã đăng (ô tháp và ô Việt bị ẩn)', async () => {
        assert.deepStrictEqual(list.map((x) => x.key), ['qua-bieu', 'qua-gon', 'hang-ngay']);
    });
    await t('đếm sản phẩm không tính bản nháp', async () => { assert.strictEqual(by('qua-gon').count, 2); });
    await t('giá "từ" là giá hiệu lực thấp nhất (có tính giá khuyến mãi)', async () => {
        assert.strictEqual(by('qua-bieu').minPrice, 850000); assert.strictEqual(by('qua-gon').minPrice, 300000);
    });
    await t('ảnh bìa: ảnh danh mục do admin đặt được ưu tiên; không có thì lấy sản phẩm mới nhất đã đăng', async () => {
        assert(by('qua-bieu').cover.includes('admin-cover')); assert(by('qua-gon').cover.includes('khay1')); assert(!by('qua-gon').cover.includes('draft'));
    });
    await t('ảnh bìa theo sản phẩm tiêu biểu (coverProduct) khi sản phẩm đó đã đăng', async () => { assert(by('hang-ngay').cover.includes('/nho.jpg')); });
    await t('liên kết: một danh mục dùng ?category=slug, nhiều danh mục nối bằng dấu phẩy', async () => {
        assert.strictEqual(by('qua-bieu').link, '/products?category=gio-qua-trai-cay');
        assert(by('hang-ngay').link.startsWith('/products?category=tao-nhap-khau,'));
    });
    await t('cache 2 phút: gọi lại không truy vấn DB thêm', async () => {
        const q = queries; await svc.getHomeCollections(); assert.strictEqual(queries, q);
    });
    await t('lỗi DB: dùng bản cũ trong cache; chưa có cache thì trả mảng rỗng (trang chủ không vỡ)', async () => {
        svc.clearCache(); const old = prisma.category.findMany; prisma.category.findMany = async () => { throw new Error('DB down'); };
        assert.deepStrictEqual(await svc.getHomeCollections(), []);
        prisma.category.findMany = old;
    });

    console.log(`\nTổng ok: ${pass}, lỗi: ${failN}`);
    process.exit(failN ? 1 : 0);
})();
