/**
 * Dữ liệu bổ sung cho trang bài viết blog công khai (BA v9, S48):
 * mục lục tự sinh, bài viết liên quan, sản phẩm liên quan, link chia sẻ, JSON-LD.
 */
const prisma = require('../../config/db');
const content = require('./content.service');
const { getActivePromotions, calculateBestPrice } = require('../../utils/promotion-helper');

const STOP_WORDS = new Set(['cua', 'cho', 'nhung', 'va', 'la', 'tai', 'nen', 'mua', 'cach', 'gia', 'nay', 'hom', 'sao', 'moi', 'tot', 'rat', 'nhat', 'khi', 'mot', 'cac', 'voi', 'duoc', 'trong', 'cung', 'cua', 'khong', 'nhu', 'the', 'nao', 'hay', 'ngay', 'bai', 'viet', 'tin', 'tuc']);
const PRODUCT_INDEX_TTL_MS = 5 * 60 * 1000;

const plainText = (html) => String(html || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

/* ---------- Mục lục và tối ưu nội dung ---------- */

/**
 * Gắn id cho h2/h3 (để làm mục lục và neo liên kết), thêm loading="lazy" cho ảnh chưa có.
 * @returns {{html: string, toc: Array<{id:string,text:string,level:number}>}}
 */
function enhanceArticle(html) {
    const toc = [];
    const used = new Set();
    let out = String(html || '').replace(/<(h[23])([^>]*)>([\s\S]*?)<\/\1>/gi, (m, tag, attrs, inner) => {
        const text = plainText(inner);
        if (!text) return m;
        const base = content.toSlug(text, 60) || 'muc';
        let id = base;
        let n = 2;
        while (used.has(id)) id = `${base}-${n++}`;
        used.add(id);
        toc.push({ id, text, level: Number(tag[1]) });
        const cleanAttrs = attrs.replace(/\sid\s*=\s*("[^"]*"|'[^']*')/i, '');
        return `<${tag}${cleanAttrs} id="${id}">${inner}</${tag}>`;
    });
    out = out.replace(/<img(?![^>]*\sloading=)([^>]*)>/gi, '<img loading="lazy"$1>');
    return { html: out, toc };
}

/* ---------- Từ khóa, bài viết liên quan ---------- */

const tagList = (tags) => String(tags || '').split(',').map((t) => t.trim()).filter(Boolean);

function keywordsOf(blog) {
    const set = new Set();
    tagList(blog.tags).forEach((t) => {
        const s = content.toSlug(t);
        if (s) { set.add(s); s.split('-').forEach((w) => { if (w.length >= 3 && !STOP_WORDS.has(w)) set.add(w); }); }
    });
    content.toSlug(blog.title || '', 200).split('-').forEach((w) => { if (w.length >= 3 && !STOP_WORDS.has(w)) set.add(w); });
    return [...set];
}

async function findRelatedPosts(blog, limit = 3) {
    const candidates = await prisma.blogPost.findMany({
        where: { is_published: true, post_type: 'blog', id: { not: blog.id } },
        orderBy: { created_at: 'desc' },
        take: 30,
        select: { id: true, title: true, slug: true, summary: true, thumbnail_url: true, created_at: true, published_at: true, tags: true }
    });
    const mine = new Set(tagList(blog.tags).map((t) => content.toSlug(t)));
    return candidates
        .map((c) => ({ c, score: tagList(c.tags).filter((t) => mine.has(content.toSlug(t))).length }))
        .sort((a, b) => b.score - a.score || new Date(b.c.created_at) - new Date(a.c.created_at))
        .slice(0, limit)
        .map((x) => x.c);
}

/* ---------- Sản phẩm liên quan ---------- */

let productIndex = null;
let productIndexAt = 0;

async function getProductIndex() {
    if (productIndex && Date.now() - productIndexAt < PRODUCT_INDEX_TTL_MS) return productIndex;
    const rows = await prisma.product.findMany({ where: { status: 'published' }, select: { id: true, name: true } });
    productIndex = rows.map((r) => {
        const slug = content.toSlug(r.name);
        return { id: r.id, slug, tokens: new Set(slug.split('-')) };
    });
    productIndexAt = Date.now();
    return productIndex;
}

/** Sản phẩm khớp từ khóa của bài (tên sản phẩm chứa từ khóa), nếu thiếu thì bổ sung bán chạy/nổi bật. */
async function findRelatedProducts(blog, limit = 4) {
    const idx = await getProductIndex();
    const keys = keywordsOf(blog);
    const scored = idx
        .map((p) => {
            let score = 0;
            keys.forEach((k) => {
                if (k.includes('-')) { if (p.slug.includes(k)) score += 3; }
                else if (p.tokens.has(k)) score += 1;
            });
            return { id: p.id, score };
        })
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((x) => x.id);

    let ids = scored;
    if (ids.length < limit) {
        const fill = await prisma.product.findMany({
            where: { status: 'published', OR: [{ is_best_seller: true }, { is_featured: true }], id: { notIn: ids.length ? ids : [0] } },
            select: { id: true },
            take: limit - ids.length,
            orderBy: { created_at: 'desc' }
        });
        ids = ids.concat(fill.map((f) => f.id));
    }
    if (!ids.length) return [];

    const [products, promotions] = await Promise.all([
        prisma.product.findMany({ where: { id: { in: ids } }, include: { images: { where: { is_thumbnail: true }, take: 1 }, categories: true } }),
        getActivePromotions()
    ]);
    const order = new Map(ids.map((id, i) => [id, i]));
    return products
        .sort((a, b) => order.get(a.id) - order.get(b.id))
        .map((p) => ({ ...p, ...calculateBestPrice(p, promotions) }));
}

/* ---------- Chia sẻ, SEO ---------- */

function shareLinks(url, title) {
    const u = encodeURIComponent(url);
    return {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
        twitter: `https://twitter.com/intent/tweet?url=${u}&text=${encodeURIComponent(title)}`
    };
}

/** Thẻ <head> bổ sung: Open Graph, Twitter Card và JSON-LD BlogPosting. */
function buildHeadExtra({ blog, url, description, image }) {
    const e = content.escapeHtml;
    const published = blog.published_at || blog.created_at;
    const tags = [
        `<meta property="og:type" content="article">`,
        `<meta property="og:title" content="${e(blog.seo_title || blog.title)}">`,
        `<meta property="og:description" content="${e(description)}">`,
        `<meta property="og:url" content="${e(url)}">`,
        `<meta property="og:site_name" content="Hải Anh Fruit">`,
        `<meta property="article:published_time" content="${e(new Date(published).toISOString())}">`,
        `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}">`
    ];
    if (image) tags.push(`<meta property="og:image" content="${e(image)}">`);
    tagList(blog.tags).forEach((t) => tags.push(`<meta property="article:tag" content="${e(t)}">`));
    const ld = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: blog.seo_title || blog.title,
        description,
        datePublished: new Date(published).toISOString(),
        dateModified: new Date(blog.updated_at || published).toISOString(),
        mainEntityOfPage: url,
        author: { '@type': 'Person', name: (blog.author && blog.author.full_name) || 'Hải Anh Fruit' },
        publisher: { '@type': 'Organization', name: 'Hải Anh Fruit' }
    };
    if (image) ld.image = [image];
    tags.push(`<script type="application/ld+json">${content.jsonForScript(ld)}</script>`);
    return tags.join('\n    ');
}

module.exports = {
    enhanceArticle,
    findRelatedPosts,
    findRelatedProducts,
    keywordsOf,
    shareLinks,
    buildHeadExtra,
    plainText,
    _resetProductIndex: () => { productIndex = null; }
};
