const prisma = require('../../../config/db');
const content = require('../../posts/content.service');
const { optimizeImageUrl } = require('../../media/media.service');
const postsService = require('../../posts/posts.service');
const { createCounter } = require('../../../middlewares/rate-limit.middleware');
const stats = require('../../news-stats/news-stats.service');

// Mỗi IP chỉ được "trượt" 30 lần/phút (dò token/slug) trước khi bị chặn tạm thời.
const misses = createCounter({ windowMs: 60 * 1000, max: 30 });

// Beacon thống kê: tối đa 120 sự kiện/phút/IP.
const beacons = createCounter({ windowMs: 60 * 1000, max: 120 });

// Nhớ (id, token) hợp lệ 5 phút để mỗi sự kiện không phải truy vấn DB.
const validCache = new Map();
const VALID_TTL_MS = 5 * 60 * 1000;
const VALID_MAX = 500;

const SLUG_RE = /^[a-z0-9-]{1,120}$/;

function neutral404(res) {
    return res.status(404).render('news/404', { layout: false });
}

exports.robots = (req, res) => {
    res.type('text/plain').send('User-agent: *\nDisallow: /\n');
};

/** Tắt khu tin ẩn -> 404; IP dò quá nhiều -> 429. */
exports.guard = (req, res, next) => {
    if (req.newsSettings && !req.newsSettings.enabled) return neutral404(res);
    const state = misses.peek(req.ip || 'unknown');
    if (state.limited) {
        res.set('Retry-After', String(state.retryAfter));
        return res.status(429).type('text/plain').send('Too many requests');
    }
    next();
};

function miss(req, res) {
    misses.hit(req.ip || 'unknown');
    return neutral404(res);
}

const fmtDate = (d) => new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);

/** [GET] /tin-tuc/:date/:slug/:token — chỉ hiển thị khi cả 3 phần khớp và bài đã đăng. */
exports.show = async (req, res, next) => {
    try {
        const { date, slug, token } = req.params;
        if (!content.isValidUrlDate(date) || !SLUG_RE.test(slug) || !content.isValidAccessToken(token)) {
            return miss(req, res);
        }
        const post = await prisma.blogPost.findUnique({ where: { access_token: token } });
        if (!post || post.post_type !== 'news' || !post.is_published || post.url_date !== date || post.slug !== slug) {
            return miss(req, res);
        }

        // Lượt vào do server đếm (không phụ thuộc JS); bỏ qua bot/trình xem trước liên kết.
        if (!stats.isBot(req.get('user-agent'))) stats.record(post.id, 'view');

        const settings = req.newsSettings;
        const affiliateUrl = post.affiliate_url || settings.defaultAffiliateUrl || null;
        const adImage = post.ad_image_url || post.thumbnail_url || null;
        const popup = affiliateUrl ? {
            postId: post.id,
            token: post.access_token,
            affiliateUrl,
            delayMs: settings.popupDelayMs,
            headline: post.ad_headline || post.title,
            image: adImage ? optimizeImageUrl(adImage, 900) : null,
            cta: post.ad_cta_text || 'Xem ưu đãi'
        } : null;
        const isFileVideo = !!post.video_url && /res\.cloudinary\.com\/.+\/video\/upload\//.test(post.video_url);

        res.render('news/show', {
            layout: false,
            post,
            pageTitle: post.seo_title || post.title,
            pageDesc: post.seo_description || post.summary || '',
            canonicalUrl: postsService.buildPostUrl(post, settings),
            coverUrl: post.thumbnail_url ? optimizeImageUrl(post.thumbnail_url, 1200) : null,
            ogImage: post.thumbnail_url ? optimizeImageUrl(post.thumbnail_url, 1200) : null,
            gallery: (Array.isArray(post.gallery) ? post.gallery : []).map((u) => optimizeImageUrl(u, 900)),
            videoUrl: post.video_url || null,
            isFileVideo,
            affiliateUrl,
            // JSON nhúng trong <script>: escape < > & để không thoát được khỏi thẻ script
            popupJson: popup ? content.jsonForScript(popup) : null,
            ctaText: post.ad_cta_text || 'Xem ưu đãi',
            readMinutes: content.estimateReadMinutes(post.content),
            dateLabel: fmtDate(post.published_at || post.created_at),
            tags: post.tags ? post.tags.split(',').filter(Boolean) : []
        });
    } catch (e) {
        next(e);
    }
};

const TRACK_EVENTS = new Set(stats.CLIENT_EVENTS);

async function isValidPost(id, token) {
    const hit = validCache.get(token);
    if (hit && hit.id === id && Date.now() - hit.ts < VALID_TTL_MS) return true;
    const post = await prisma.blogPost.findUnique({ where: { access_token: token }, select: { id: true, post_type: true, is_published: true } });
    if (!post || post.id !== id || post.post_type !== 'news' || !post.is_published) {
        validCache.delete(token);
        return false;
    }
    if (validCache.size >= VALID_MAX) validCache.clear();
    validCache.set(token, { id, ts: Date.now() });
    return true;
}

/** [POST] /t — beacon từ popup/banner/CTA. Luôn trả 204 để không lộ bài nào hợp lệ. */
exports.track = async (req, res, next) => {
    try {
        if (beacons.hit(req.ip || 'unknown').limited) return res.status(429).end();
        if (stats.isBot(req.get('user-agent'))) return res.status(204).end();
        const { id, token, event } = req.body || {};
        if (!Number.isInteger(id) || !content.isValidAccessToken(token) || !TRACK_EVENTS.has(event)) return res.status(400).end();
        if (await isValidPost(id, token)) stats.record(id, event);
        res.status(204).end();
    } catch (e) {
        next(e);
    }
};

exports.notFound = (req, res) => miss(req, res);

// eslint-disable-next-line no-unused-vars
exports.errorHandler = (err, req, res, next) => {
    if (err && err.status && err.status < 500) return res.status(err.status).end(); // JSON hỏng/quá lớn từ beacon
    console.error('NEWS HOST ERROR:', err);
    res.status(500).type('text/plain').send('Đã có lỗi xảy ra.');
};

exports._misses = misses;
exports._validCache = validCache;
