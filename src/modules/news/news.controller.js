/**
 * Admin quản lý Tin tức ẩn (post_type = 'news').
 * Dùng chung posts.service với API để luật kiểm tra dữ liệu giống hệt nhau.
 */
const prisma = require('../../config/db');
const postsService = require('../posts/posts.service');
const content = require('../posts/content.service');
const newsSettings = require('../settings/news-settings.service');
const newsStats = require('../news-stats/news-stats.service');

const PAGE_SIZE = 15;
const STAT_EVENTS = ['view', 'popup_show', 'popup_close', 'cta_popup', 'cta_banner', 'cta_inline'];

const FORM_FIELDS = [
    'title', 'summary', 'content', 'status', 'affiliate_url', 'ad_headline', 'ad_cta_text',
    'ad_image_url', 'video_embed_url', 'tags', 'seo_title', 'seo_description'
];

const toFiles = (req) => req.files || {};

/** Lấy các trường form có mặt trong req.body (trường vắng mặt giữ nguyên khi sửa). */
function pickBody(req) {
    const out = {};
    FORM_FIELDS.forEach((f) => { if (req.body[f] !== undefined) out[f] = req.body[f]; });
    if (out.status !== undefined) out.status = out.status === 'published' ? 'published' : 'draft';
    return out;
}

async function loadStats(ids) {
    await newsStats.flush(); // đưa số liệu còn trong bộ nhớ xuống DB để admin thấy số mới nhất
    const stats = {};
    ids.forEach((id) => { stats[id] = Object.fromEntries(STAT_EVENTS.map((e) => [e, 0])); });
    if (!ids.length) return stats;
    const rows = await prisma.newsStatDaily.groupBy({
        by: ['post_id', 'event'],
        where: { post_id: { in: ids } },
        _sum: { count: true }
    });
    rows.forEach((r) => { if (stats[r.post_id]) stats[r.post_id][r.event] = r._sum.count || 0; });
    return stats;
}

const clicksOf = (s) => (s.cta_popup || 0) + (s.cta_banner || 0) + (s.cta_inline || 0);

/** [GET] /admin/news */
exports.renderList = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const filter = ['published', 'draft'].includes(req.query.status) ? req.query.status : 'all';
        const where = { post_type: 'news' };
        if (filter === 'published') where.is_published = true;
        if (filter === 'draft') where.is_published = false;

        const [posts, total, settings] = await Promise.all([
            prisma.blogPost.findMany({ where, orderBy: { created_at: 'desc' }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
            prisma.blogPost.count({ where }),
            newsSettings.get()
        ]);
        const stats = await loadStats(posts.map((p) => p.id));
        const rows = posts.map((p) => ({
            ...p,
            link: postsService.buildPostUrl(p, settings),
            stats: stats[p.id],
            clicks: clicksOf(stats[p.id])
        }));

        res.render('admin/news/index', {
            title: 'Tin tức ẩn',
            posts: rows,
            filter,
            currentPage: page,
            totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
            total,
            newsEnabled: settings.enabled,
            layout: 'layouts/admin'
        });
    } catch (e) {
        next(e);
    }
};

const renderForm = async (res, { mode, post, error, status = 200 }) => {
    const settings = await newsSettings.get();
    res.status(status).render('admin/news/form', {
        title: mode === 'create' ? 'Viết tin ẩn mới' : 'Chỉnh sửa tin ẩn',
        mode,
        post: post || {},
        error: error || null,
        defaultAffiliate: settings.defaultAffiliateUrl,
        link: mode === 'edit' && post && post.access_token ? postsService.buildPostUrl(post, settings) : null,
        layout: 'layouts/admin'
    });
};

/** [GET] /admin/news/create */
exports.renderCreate = async (req, res, next) => {
    try {
        await renderForm(res, { mode: 'create', post: { is_published: false } });
    } catch (e) {
        next(e);
    }
};

/** [POST] /admin/news */
exports.createNews = async (req, res, next) => {
    const body = { ...pickBody(req), type: 'news' };
    try {
        const { post } = await postsService.createPost({ body, files: toFiles(req) });
        req.flash('success_msg', post.is_published
            ? 'Đã đăng tin ẩn. Hãy sao chép link đầy đủ để chia sẻ.'
            : 'Đã lưu bản nháp. Bấm "Xem trước" để kiểm tra, đăng khi sẵn sàng.');
        res.redirect(`/admin/news/edit/${post.id}`);
    } catch (e) {
        if (e instanceof postsService.PostError) {
            const keep = { ...body, content: content.sanitizeContent(body.content), is_published: body.status === 'published' };
            return renderForm(res, { mode: 'create', post: keep, error: e.message, status: e.status >= 500 ? 500 : 400 }).catch(next);
        }
        next(e);
    }
};

/** [GET] /admin/news/edit/:id */
exports.renderEdit = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        const post = Number.isInteger(id) ? await prisma.blogPost.findUnique({ where: { id } }) : null;
        if (!post || post.post_type !== 'news') {
            req.flash('error_msg', 'Không tìm thấy tin ẩn.');
            return res.redirect('/admin/news');
        }
        await renderForm(res, { mode: 'edit', post });
    } catch (e) {
        next(e);
    }
};

/** [POST] /admin/news/edit/:id */
exports.updateNews = async (req, res, next) => {
    const id = parseInt(req.params.id, 10);
    try {
        const current = Number.isInteger(id) ? await prisma.blogPost.findUnique({ where: { id } }) : null;
        if (!current || current.post_type !== 'news') {
            req.flash('error_msg', 'Không tìm thấy tin ẩn.');
            return res.redirect('/admin/news');
        }
        const body = pickBody(req);
        await postsService.updatePost(id, { body, files: toFiles(req) });
        req.flash('success_msg', 'Đã cập nhật tin ẩn.');
        res.redirect(`/admin/news/edit/${id}`);
    } catch (e) {
        if (e instanceof postsService.PostError) {
            const current = await prisma.blogPost.findUnique({ where: { id } }).catch(() => null);
            const merged = { ...(current || {}), ...pickBody(req), is_published: req.body.status === 'published' };
            if (merged.content !== undefined) merged.content = content.sanitizeContent(merged.content);
            return renderForm(res, { mode: 'edit', post: merged, error: e.message, status: e.status >= 500 ? 500 : 400 }).catch(next);
        }
        next(e);
    }
};

/** [GET] /admin/news/preview/:id — xem bản nháp ngay cả khi chưa đăng (chỉ admin). */
exports.renderPreview = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        const post = Number.isInteger(id) ? await prisma.blogPost.findUnique({ where: { id } }) : null;
        if (!post || post.post_type !== 'news') {
            req.flash('error_msg', 'Không tìm thấy tin ẩn.');
            return res.redirect('/admin/news');
        }
        const settings = await newsSettings.get();
        res.render('admin/news/preview', {
            title: 'Xem trước: ' + post.title,
            post,
            link: postsService.buildPostUrl(post, settings),
            affiliateUrl: post.affiliate_url || settings.defaultAffiliateUrl || null,
            usingDefaultAffiliate: !post.affiliate_url && !!settings.defaultAffiliateUrl,
            readMinutes: content.estimateReadMinutes(post.content),
            layout: 'layouts/admin'
        });
    } catch (e) {
        next(e);
    }
};

/** [GET] /admin/news/stats/:id — thống kê 30 ngày gần nhất của một bài. */
exports.renderStats = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        const post = Number.isInteger(id) ? await prisma.blogPost.findUnique({ where: { id } }) : null;
        if (!post || post.post_type !== 'news') {
            req.flash('error_msg', 'Không tìm thấy tin ẩn.');
            return res.redirect('/admin/news');
        }
        const { totals, days } = await newsStats.getPostStats(id, 30);
        const clicks = clicksOf(totals);
        const rate = (num, den) => (den > 0 ? Math.round((num / den) * 1000) / 10 : null);
        res.render('admin/news/stats', {
            title: 'Thống kê: ' + post.title,
            post,
            totals,
            clicks,
            popupCtr: rate(totals.cta_popup, totals.popup_show),
            overallCtr: rate(clicks, totals.view),
            days,
            maxDayViews: Math.max(1, ...days.map((d) => d.view)),
            layout: 'layouts/admin'
        });
    } catch (e) {
        next(e);
    }
};

/** [POST] /admin/news/:id/toggle — đăng / gỡ về nháp nhanh từ danh sách. */
exports.togglePublish = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        const post = Number.isInteger(id) ? await prisma.blogPost.findUnique({ where: { id } }) : null;
        if (!post || post.post_type !== 'news') {
            req.flash('error_msg', 'Không tìm thấy tin ẩn.');
            return res.redirect('/admin/news');
        }
        await postsService.updatePost(id, { body: { status: post.is_published ? 'draft' : 'published' } });
        req.flash('success_msg', post.is_published ? 'Đã gỡ về bản nháp (link sẽ trả 404).' : 'Đã đăng tin.');
        res.redirect('/admin/news');
    } catch (e) {
        next(e);
    }
};

/** [DELETE] /admin/news/:id */
exports.deleteNews = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const post = Number.isInteger(id) ? await prisma.blogPost.findUnique({ where: { id } }) : null;
        if (!post || post.post_type !== 'news') return res.json({ success: false, message: 'Không tìm thấy tin ẩn.' });
        await prisma.blogPost.delete({ where: { id } });
        res.json({ success: true, message: 'Đã xóa tin ẩn.' });
    } catch (e) {
        res.json({ success: false, message: e.message });
    }
};

/* ---------- Cài đặt khu tin ẩn ---------- */

/** [GET] /admin/news/settings */
exports.renderSettings = async (req, res, next) => {
    try {
        const settings = await newsSettings.get(true);
        res.render('admin/news/settings', {
            title: 'Cài đặt tin ẩn',
            s: settings,
            layout: 'layouts/admin'
        });
    } catch (e) {
        next(e);
    }
};

const SETTING_DESC = {
    'news.enabled': 'Bật/tắt khu tin tức ẩn và API đăng bài',
    'news.host': 'Subdomain phục vụ tin tức ẩn',
    'news.default_affiliate_url': 'Link affiliate mặc định khi bài không có link riêng',
    'news.affiliate_hosts': 'Danh sách host affiliate được phép (cách nhau dấu phẩy)',
    'news.popup_delay_ms': 'Độ trễ hiện popup affiliate (ms)'
};

/** [POST] /admin/news/settings */
exports.saveSettings = async (req, res, next) => {
    try {
        const b = req.body;
        const host = String(b.host || '').trim().toLowerCase();
        if (!/^[a-z0-9]([a-z0-9.-]*[a-z0-9])?(:\d{2,5})?$/.test(host) || !host.includes('.') && !host.startsWith('tin.localhost')) {
            req.flash('error_msg', 'Host tin ẩn không hợp lệ (ví dụ: tin.haianhfruit.com).');
            return res.redirect('/admin/news/settings');
        }
        const hostsList = String(b.affiliate_hosts || '').split(/[\n,]+/).map((h) => h.trim().toLowerCase()).filter(Boolean);
        if (hostsList.some((h) => !/^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/.test(h))) {
            req.flash('error_msg', 'Danh sách host affiliate chứa giá trị không hợp lệ.');
            return res.redirect('/admin/news/settings');
        }
        const hostsCsv = hostsList.join(',');

        let defaultUrl = '';
        try {
            defaultUrl = content.validateAffiliateUrl(b.default_affiliate_url, hostsCsv) || '';
        } catch (e) {
            req.flash('error_msg', 'Link affiliate mặc định: ' + e.message);
            return res.redirect('/admin/news/settings');
        }

        const delay = parseInt(b.popup_delay_ms, 10);
        if (!Number.isFinite(delay) || delay < 0 || delay > 30000) {
            req.flash('error_msg', 'Độ trễ popup phải từ 0 đến 30000 ms.');
            return res.redirect('/admin/news/settings');
        }

        const values = {
            'news.enabled': b.enabled === 'on' ? 'true' : 'false',
            'news.host': host,
            'news.default_affiliate_url': defaultUrl,
            'news.affiliate_hosts': hostsCsv,
            'news.popup_delay_ms': String(delay)
        };
        for (const [key, value] of Object.entries(values)) {
            await prisma.setting.upsert({
                where: { key },
                update: { value },
                create: { key, value, group_key: 'news', description: SETTING_DESC[key] }
            });
        }
        newsSettings.invalidate();
        req.flash('success_msg', 'Đã lưu cài đặt tin ẩn.');
        res.redirect('/admin/news/settings');
    } catch (e) {
        next(e);
    }
};
