/**
 * Prisma giả lập trong bộ nhớ đủ cho trang shop (/products) và chi tiết sản phẩm (/product/:slug).
 * Dùng cho tests/s53-shop-v2.test.js và máy chủ xem thử giao diện. Chỉ hỗ trợ đúng các truy vấn mà
 * products.controller.js đang dùng.
 */
const img = (id) => `https://images.unsplash.com/${id}?w=700&q=80`;
const RAW = [
    ['Dâu Hàn Quốc', 'dau-han', 289000, 259000, 'photo-1464965911861-746a04b4bca6', 8, 'Hàn Quốc'],
    ['Nho Mỹ không hạt', 'nho-my', 169000, null, 'photo-1537640538966-79f369143f8f', 6, 'Mỹ'],
    ['Cherry Úc', 'cherry-uc', 459000, null, 'photo-1528821128474-27f963b062bf', 4, 'Úc'],
    ['Xoài Úc R2E2', 'xoai-uc', 99000, 89000, 'photo-1553279768-865429fa0078', 12, 'Úc'],
    ['Kiwi vàng Zespri', 'kiwi', 149000, null, 'photo-1585059895524-72359e06133a', 9, 'New Zealand'],
    ['Táo Envy', 'tao-envy', 189000, null, 'photo-1560806887-1e4cd0b6cbd6', 7, 'New Zealand'],
    ['Lê Hàn Quốc', 'le-han', 139000, null, 'photo-1514756331096-242fdeb70d4a', 0, 'Hàn Quốc'],
    ['Cam Navel Úc', 'cam-navel', 119000, null, 'photo-1547514701-42782101795e', 10, 'Úc'],
    ['Nho đỏ Chile', 'nho-do', 159000, null, 'photo-1537640538966-79f369143f8f', 5, 'Chile'],
    ['Dâu Nhật Bản', 'dau-nhat', 590000, 540000, 'photo-1464965911861-746a04b4bca6', 3, 'Nhật Bản'],
    ['Táo Fuji', 'tao-fuji', 129000, null, 'photo-1560806887-1e4cd0b6cbd6', 14, 'Nhật Bản'],
    ['Xoài Cát Hòa Lộc', 'xoai-cat', 79000, null, 'photo-1553279768-865429fa0078', 20, 'Việt Nam'],
    ['Cam vàng Mỹ', 'cam-my', 99000, null, 'photo-1547514701-42782101795e', 11, 'Mỹ'],
    ['Kiwi xanh', 'kiwi-xanh', 109000, null, 'photo-1585059895524-72359e06133a', 8, 'New Zealand']
];

const CATS = [
    { id: 1, name: 'Trái cây Mỹ', slug: 'my', is_active: true, parent_id: null, sort_order: 1, image_url: null },
    { id: 2, name: 'Nho', slug: 'nho', is_active: true, parent_id: 1, sort_order: 1 },
    { id: 3, name: 'Hàn Quốc', slug: 'han', is_active: true, parent_id: null, sort_order: 2 },
    { id: 4, name: 'Úc', slug: 'uc', is_active: true, parent_id: null, sort_order: 3 }
];

function build() {
    const catOf = (i) => [3, 2, 4, 4, 1, 1, 3, 4, 2, 3, 1, 4, 1, 1][i];
    const products = RAW.map((p, i) => ({
        id: i + 1, name: p[0], slug: p[1], sku: 'SKU' + (i + 1), price: p[2], sale_price: p[3], is_flash_sale: false, flash_sale_price: null, flash_sale_end: null,
        stock_quantity: p[5], status: 'published', is_featured: i % 3 === 0, is_best_seller: i % 2 === 0, unit: 'kg', origin_country: p[6],
        category_id: catOf(i), categories: [{ category_id: catOf(i) }], short_description: 'Trái cây nhập khẩu tươi ngon, tuyển chọn kỹ.',
        description: '<p>Mô tả chi tiết sản phẩm.</p>', nutritional_info: 'Vitamin C, chất xơ.', weight_value: 1, packing_type: 'Hộp 1kg',
        images: [0, 1, 2].map((k) => ({ image_url: img(p[4]), is_thumbnail: k === 0, sort_order: k })), reviews: [],
        created_at: new Date(Date.now() - i * 86400000)
    }));
    return { products, cats: CATS };
}

function matches(p, where = {}) {
    for (const [k, v] of Object.entries(where)) {
        if (k === 'status' && p.status !== v) return false;
        if (k === 'OR' && Array.isArray(v) && v[0] && v[0].name && !v.some((c) => (c.name && p.name.toLowerCase().includes(String(c.name.contains).toLowerCase())) || (c.sku && p.sku.toLowerCase().includes(String(c.sku.contains).toLowerCase())))) return false;
        if (k === 'origin_country' && v.in && !v.in.includes(p.origin_country)) return false;
        if (k === 'price') { if (v.gte !== undefined && p.price < v.gte) return false; if (v.lte !== undefined && p.price > v.lte) return false; }
        if (k === 'stock_quantity' && v.gt !== undefined && !(p.stock_quantity > v.gt)) return false;
        if (k === 'sale_price' && v.not === null && p.sale_price === null) return false;
        if (k === 'created_at' && v.gte && p.created_at < v.gte) return false;
        if (k === 'AND') {
            const ids = v[0].OR[0].category_id.in;
            if (!ids.includes(p.category_id)) return false;
        }
    }
    return true;
}

function create() {
    const { products, cats } = build();
    const withCount = (c) => ({ ...c, _count: { product_categories: products.filter((p) => p.status === 'published' && p.category_id === c.id).length } });
    return {
        products,
        prisma: {
            category: {
                findUnique: async ({ where }) => (where.slug ? cats.find((c) => c.slug === where.slug) : cats.find((c) => c.id === where.id)) || null,
                findMany: async ({ where = {}, include } = {}) => cats.filter((c) => (where.is_active === undefined || c.is_active === where.is_active) && (where.parent_id === undefined || c.parent_id === where.parent_id)).map((c) => (include ? withCount(c) : { ...c }))
            },
            promotionCampaign: { findMany: async () => [] },
            banner: { findMany: async () => [] },
            blogPost: { findMany: async () => [] },
            shippingCampaign: { findFirst: async () => null },
            product: {
                findMany: async ({ where = {}, orderBy, skip = 0, take = 100 } = {}) => {
                    let rows = products.filter((p) => matches(p, where) && (!where.id || !where.id.not || p.id !== where.id.not));
                    if (where.id && where.id.in) rows = rows.filter((p) => where.id.in.includes(p.id));
                    if (orderBy && orderBy.price) rows.sort((a, b) => (orderBy.price === 'asc' ? a.price - b.price : b.price - a.price));
                    else if (orderBy && orderBy.name) rows.sort((a, b) => a.name.localeCompare(b.name));
                    else rows.sort((a, b) => b.created_at - a.created_at);
                    return rows.slice(skip, skip + take).map((p) => ({ ...p, images: p.images.filter((i) => i.is_thumbnail).slice(0, 1), category: { name: cats.find((c) => c.id === p.category_id).name, slug: cats.find((c) => c.id === p.category_id).slug } }));
                },
                count: async ({ where = {} } = {}) => products.filter((p) => matches(p, where)).length,
                groupBy: async () => {
                    const m = {};
                    products.forEach((p) => { m[p.origin_country] = (m[p.origin_country] || 0) + 1; });
                    return Object.entries(m).map(([origin_country, n]) => ({ origin_country, _count: { origin_country: n } }));
                },
                findUnique: async ({ where }) => {
                    const p = products.find((x) => x.slug === where.slug);
                    return p ? { ...p, category: cats.find((c) => c.id === p.category_id), categories: p.categories.map((c) => ({ ...c, category: cats.find((k) => k.id === c.category_id) })) } : null;
                }
            },
            wishlist: { findUnique: async () => null },
            customer: { findUnique: async () => null }
        }
    };
}

module.exports = { create };
