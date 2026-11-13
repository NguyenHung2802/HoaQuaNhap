/**
 * "Bộ sưu tập theo nhu cầu" ở trang chủ: mỗi ô gắn với một hoặc nhiều danh mục thật.
 * Số sản phẩm, giá "từ" và ảnh bìa lấy từ DB (ảnh danh mục do admin đặt, nếu không có thì ảnh đại diện
 * của sản phẩm mới nhất). Ô nào chưa có sản phẩm đã đăng thì tự ẩn. Kết quả cache 2 phút cho VPS nhỏ.
 */
const prisma = require('../../../config/db');

const TTL_MS = 2 * 60 * 1000;

// Sửa nội dung các ô ở đây. slugs = danh mục (slug) thuộc ô; link = đường dẫn "Xem bộ sưu tập".
const TILES = [
    { key: 'qua-bieu', size: 'lg', eyebrow: 'Quà biếu', title: 'Quà biếu sang trọng',
      desc: 'Giỏ quà trái cây kết nơ, hoa tươi và lưới trang trí, chuẩn bị sẵn cho sinh nhật, khai trương, lễ Tết.',
      slugs: ['gio-qua-trai-cay'] },
    { key: 'qua-gon', size: 'sm', eyebrow: 'Thăm hỏi', title: 'Quà gọn nhẹ',
      desc: 'Khay và hộp quà vừa tay, đẹp mắt, hợp thăm hỏi, tân gia, tặng đồng nghiệp.',
      slugs: ['khay-hop-qua-trai-cay'] },
    { key: 'di-le', size: 'sm', eyebrow: 'Lễ cúng', title: 'Đi lễ, cúng rằm',
      desc: 'Tháp quà và mâm trái cây trang trọng cho ngày lễ, mừng thọ.',
      slugs: ['thap-qua-qua-di-le'] },
    { key: 'hang-ngay', size: 'sm', eyebrow: 'Hằng ngày', title: 'Ăn ngon mỗi ngày',
      desc: 'Táo, nho, kiwi, cherry, cam nhập khẩu chính ngạch, tuyển chọn tươi.',
      slugs: ['tao-nhap-khau', 'nho-nhap-khau', 'kiwi-le-cherry-nhap-khau', 'cam-quyt-kim-quat-nhap-khau'],
      coverProduct: 'nho-sua-han-quoc-shine-muscat' },
    { key: 'viet', size: 'sm', eyebrow: 'Đặc sản Việt', title: 'Trái cây Việt',
      desc: 'Xoài, măng cụt, bưởi, sầu riêng chọn từ vườn, vào mùa là ngon nhất.',
      slugs: ['trai-cay-viet-nam'], coverProduct: 'mang-cut' }
];
// coverProduct (tùy chọn): slug sản phẩm làm ảnh bìa; không có hoặc chưa đăng thì dùng quy tắc mặc định.

let cached = null;
let builtAt = 0;
let inflight = null;

const effectivePrice = (p) => {
    const sale = p.sale_price !== null && p.sale_price !== undefined ? Number(p.sale_price) : null;
    const base = Number(p.price);
    return sale && sale > 0 && sale < base ? sale : base;
};

async function build() {
    const allSlugs = [...new Set(TILES.flatMap((t) => t.slugs))];
    const cats = await prisma.category.findMany({ where: { slug: { in: allSlugs }, is_active: true } });
    const bySlug = new Map(cats.map((c) => [c.slug, c]));
    const out = [];
    for (const t of TILES) {
        const ids = t.slugs.map((s) => bySlug.get(s)).filter(Boolean).map((c) => c.id);
        if (!ids.length) continue;
        const where = {
            status: 'published',
            OR: [{ category_id: { in: ids } }, { categories: { some: { category_id: { in: ids } } } }]
        };
        const [count, products] = await Promise.all([
            prisma.product.count({ where }),
            prisma.product.findMany({
                where, orderBy: { created_at: 'desc' }, take: 60,
                select: { price: true, sale_price: true, images: { where: { is_thumbnail: true }, take: 1, select: { image_url: true } } }
            })
        ]);
        if (!count) continue;
        const prices = products.map(effectivePrice).filter((n) => n > 0);
        const catCover = t.slugs.map((s) => bySlug.get(s)).find((c) => c && c.image_url);
        let prodCover = products.find((p) => p.images[0]);
        if (t.coverProduct) {
            const pick = await prisma.product.findFirst({
                where: { slug: t.coverProduct, status: 'published' },
                select: { images: { where: { is_thumbnail: true }, take: 1, select: { image_url: true } } }
            });
            if (pick && pick.images[0]) prodCover = pick;
        }
        out.push({
            key: t.key, size: t.size, eyebrow: t.eyebrow, title: t.title, desc: t.desc,
            count, minPrice: prices.length ? Math.min(...prices) : null,
            cover: catCover ? catCover.image_url : (prodCover ? prodCover.images[0].image_url : null),
            link: t.slugs.length === 1 ? `/products?category=${t.slugs[0]}` : `/products?category=${t.slugs.join(',')}`
        });
    }
    return out;
}

/** Trả về danh sách ô (đã bỏ ô rỗng). Lỗi DB thì dùng bản cũ nếu có, không có thì trả mảng rỗng. */
async function getHomeCollections() {
    if (cached && Date.now() - builtAt < TTL_MS) return cached;
    if (!inflight) {
        inflight = build().then((r) => { cached = r; builtAt = Date.now(); return r; }).finally(() => { inflight = null; });
    }
    try {
        return await inflight;
    } catch (e) {
        return cached || [];
    }
}

function clearCache() { cached = null; builtAt = 0; }

module.exports = { getHomeCollections, clearCache, TILES };
