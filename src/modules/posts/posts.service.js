/**
 * Nghiệp vụ tạo/sửa/xóa bài viết dùng cho API (và sau này cho admin tin ẩn).
 * Quy tắc: kiểm tra dữ liệu trước, upload media sau, tạo bài cuối; lỗi giữa chừng thì dọn media đã upload.
 */
const defaultPrisma = require('../../config/db');
const cloudinary = require('../../config/cloudinary');
const content = require('./content.service');
const media = require('../media/media.service');
const newsSettings = require('../settings/news-settings.service');

const MAX_GALLERY = 10;
const TYPES = ['blog', 'news'];
const STATUSES = ['draft', 'published'];

// Cho phép test thay thế phụ thuộc.
const deps = { prisma: defaultPrisma, media, newsSettings, cloudinary };

class PostError extends Error {
    constructor(message, code = 'bad_request', status = 400) {
        super(message);
        this.name = 'PostError';
        this.code = code;
        this.status = status;
    }
}

/* ---------- Chuẩn hóa dữ liệu đầu vào (JSON hoặc multipart) ---------- */

const str = (v) => (v === undefined || v === null ? undefined : String(v).trim());

function toList(v) {
    if (v === undefined || v === null || v === '') return [];
    if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
    const s = String(v).trim();
    if (s.startsWith('[')) {
        try {
            const arr = JSON.parse(s);
            if (Array.isArray(arr)) return arr.map((x) => String(x).trim()).filter(Boolean);
        } catch (e) { /* rơi xuống tách theo dòng/dấu phẩy */ }
    }
    return s.split(/[\n,]+/).map((x) => x.trim()).filter(Boolean);
}

function parseDate(v) {
    if (v === undefined || v === null || v === '') return null;
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) throw new PostError('published_at không phải ngày hợp lệ.', 'invalid_date');
    return d;
}

function wrapContent(fn) {
    try {
        return fn();
    } catch (e) {
        if (e instanceof content.ContentError) throw new PostError(e.message, e.code, 400);
        throw e;
    }
}

function wrapMedia(e) {
    if (e instanceof media.MediaError) return new PostError(e.message, e.code, e.status || 400);
    return e;
}

function summaryFromHtml(html) {
    return content.sanitizeText(html, 160);
}

/* ---------- URL công khai ---------- */

function siteBase() {
    return (process.env.SITE_URL || 'https://haianhfruit.com').replace(/\/+$/, '');
}

function newsBase(settings) {
    const isProd = process.env.NODE_ENV === 'production';
    const host = settings.host;
    if (isProd) return `https://${host}`;
    const hasPort = /:\d+$/.test(host);
    return `http://${host}${hasPort ? '' : ':' + (process.env.PORT || 3000)}`;
}

function buildPostUrl(post, settings) {
    if (post.post_type === 'news') {
        return `${newsBase(settings)}/tin-tuc/${post.url_date}/${post.slug}/${post.access_token}`;
    }
    return `${siteBase()}/blog/${post.slug}`;
}

function serialize(post, settings, created) {
    const out = {
        id: post.id,
        type: post.post_type,
        status: post.is_published ? 'published' : 'draft',
        title: post.title,
        slug: post.slug,
        url: buildPostUrl(post, settings),
        admin_url: `${siteBase()}/admin/${post.post_type === 'news' ? 'news' : 'blogs'}`,
        thumbnail_url: post.thumbnail_url || null,
        video_url: post.video_url || null,
        gallery: Array.isArray(post.gallery) ? post.gallery : [],
        affiliate_url: post.affiliate_url || null,
        published_at: post.published_at,
        created_at: post.created_at,
        updated_at: post.updated_at
    };
    if (created !== undefined) out.created = created;
    return out;
}

/* ---------- Tác giả và dọn dẹp ---------- */

let cachedAuthorId = null;
async function getAuthorId() {
    if (cachedAuthorId) return cachedAuthorId;
    const admin = await deps.prisma.user.findFirst({ where: { role: 'admin' }, orderBy: { id: 'asc' }, select: { id: true } });
    if (!admin) throw new PostError('Hệ thống chưa có tài khoản admin để gán tác giả.', 'no_author', 500);
    cachedAuthorId = admin.id;
    return cachedAuthorId;
}

async function cleanup(uploaded) {
    await Promise.all(uploaded.map((u) =>
        deps.cloudinary.uploader.destroy(u.public_id, { resource_type: u.type || 'image' }).catch(() => {})
    ));
}

/** Upload mọi media của request; trả về {data, uploaded} và tự dọn nếu lỗi. */
async function processMedia({ files = {}, body, folder, videoEmbed, needCover }) {
    const uploaded = [];
    const out = { thumbnail_url: undefined, gallery: undefined, video_url: undefined, ad_image_url: undefined };
    try {
        const coverFile = (files.cover || [])[0];
        if (coverFile) {
            const r = await deps.media.uploadImageBuffer(coverFile.buffer, folder);
            uploaded.push({ public_id: r.public_id, type: 'image' });
            out.thumbnail_url = r.url;
        } else if (str(body.cover_url)) {
            const r = await deps.media.uploadImageFromUrl(str(body.cover_url), folder);
            uploaded.push({ public_id: r.public_id, type: 'image' });
            out.thumbnail_url = r.url;
        }

        const galleryFiles = files.images || [];
        const galleryUrls = toList(body.image_urls);
        if (galleryFiles.length + galleryUrls.length > MAX_GALLERY) {
            throw new PostError(`Tối đa ${MAX_GALLERY} ảnh trong gallery.`, 'too_many_images');
        }
        if (galleryFiles.length || galleryUrls.length) {
            const urls = [];
            for (const f of galleryFiles) {
                const r = await deps.media.uploadImageBuffer(f.buffer, folder);
                uploaded.push({ public_id: r.public_id, type: 'image' });
                urls.push(r.url);
            }
            for (const u of galleryUrls) {
                const r = await deps.media.uploadImageFromUrl(u, folder);
                uploaded.push({ public_id: r.public_id, type: 'image' });
                urls.push(r.url);
            }
            out.gallery = urls;
        }

        const videoFile = (files.video || [])[0];
        if (videoFile) {
            const r = await deps.media.uploadVideoBuffer(videoFile.buffer, folder + '/video');
            uploaded.push({ public_id: r.public_id, type: 'video' });
            out.video_url = r.url;
        } else if (videoEmbed) {
            out.video_url = videoEmbed.url;
        }

        const adFile = (files.ad_image || [])[0];
        if (adFile) {
            const r = await deps.media.uploadImageBuffer(adFile.buffer, folder + '/ads');
            uploaded.push({ public_id: r.public_id, type: 'image' });
            out.ad_image_url = r.url;
        } else if (str(body.ad_image_url)) {
            const r = await deps.media.uploadImageFromUrl(str(body.ad_image_url), folder + '/ads');
            uploaded.push({ public_id: r.public_id, type: 'image' });
            out.ad_image_url = r.url;
        }

        if (needCover && !out.thumbnail_url) {
            // Ảnh bìa không bắt buộc ở API; để trống thì dùng ảnh gallery đầu tiên nếu có.
            if (out.gallery && out.gallery.length) out.thumbnail_url = out.gallery[0];
        }
        return { data: out, uploaded };
    } catch (e) {
        await cleanup(uploaded);
        throw wrapMedia(e);
    }
}

/* ---------- Tạo bài ---------- */

async function createPost({ body = {}, files = {} }) {
    const settings = await deps.newsSettings.get();

    const title = content.sanitizeText(body.title, 200);
    if (!title) throw new PostError('Thiếu tiêu đề (title).', 'missing_title');

    const type = str(body.type) || 'blog';
    if (!TYPES.includes(type)) throw new PostError('type chỉ nhận "blog" hoặc "news".', 'invalid_type');

    const status = str(body.status) || 'draft';
    if (!STATUSES.includes(status)) throw new PostError('status chỉ nhận "draft" hoặc "published".', 'invalid_status');

    const html = content.sanitizeContent(body.content);
    if (!html) throw new PostError('Thiếu nội dung (content).', 'missing_content');

    const summary = content.sanitizeText(body.summary, 500) || summaryFromHtml(html);
    const affiliate = wrapContent(() => content.validateAffiliateUrl(body.affiliate_url, settings.affiliateHostsRaw));
    const videoEmbed = wrapContent(() => content.normalizeVideoUrl(body.video_embed_url));
    const requestedDate = parseDate(body.published_at);

    const externalId = content.sanitizeText(body.external_id, 120) || null;
    const source = content.sanitizeText(body.source, 50) || (externalId ? 'api' : null);

    // Idempotency: cùng source + external_id thì trả bài cũ, không upload lại.
    if (externalId) {
        const existing = await deps.prisma.blogPost.findUnique({ where: { source_external_id: { source, external_id: externalId } } });
        if (existing) return { post: existing, settings, created: false };
    }

    const authorId = await getAuthorId();
    const folder = type === 'news' ? 'news' : 'blogs';
    const { data: m, uploaded } = await processMedia({ files, body, folder, videoEmbed, needCover: true });

    const publishedAt = status === 'published' ? (requestedDate || new Date()) : null;
    const base = {
        title,
        summary,
        content: html,
        thumbnail_url: m.thumbnail_url || null,
        author_id: authorId,
        is_published: status === 'published',
        published_at: publishedAt,
        post_type: type,
        affiliate_url: affiliate,
        ad_headline: content.sanitizeText(body.ad_headline, 160) || null,
        ad_image_url: m.ad_image_url || null,
        ad_cta_text: content.sanitizeText(body.ad_cta_text, 60) || null,
        video_url: m.video_url || null,
        gallery: m.gallery || undefined,
        tags: toList(body.tags).map((t) => content.sanitizeText(t, 40)).filter(Boolean).slice(0, 15).join(',') || null,
        seo_title: content.sanitizeText(body.seo_title, 160) || null,
        seo_description: content.sanitizeText(body.seo_description, 320) || null,
        source,
        external_id: externalId
    };
    if (type === 'news') {
        base.access_token = content.generateAccessToken();
        base.url_date = content.formatUrlDate(publishedAt || new Date());
    }

    for (let attempt = 0; attempt < 2; attempt++) {
        const slug = await content.uniqueSlug(deps.prisma, str(body.slug) || title);
        try {
            const post = await deps.prisma.blogPost.create({ data: { ...base, slug } });
            return { post, settings, created: true };
        } catch (e) {
            if (e && e.code === 'P2002') {
                const target = String((e.meta && e.meta.target) || '');
                if (externalId && /external_id/.test(target)) {
                    // Hai request trùng nhau chạy song song: giữ bài đã tạo, dọn media của request này.
                    await cleanup(uploaded);
                    const existing = await deps.prisma.blogPost.findUnique({ where: { source_external_id: { source, external_id: externalId } } });
                    if (existing) return { post: existing, settings, created: false };
                }
                if (/slug/.test(target) && attempt === 0) continue; // trùng slug do chạy song song: thử lại
            }
            await cleanup(uploaded);
            throw e;
        }
    }
    await cleanup(uploaded);
    throw new PostError('Không tạo được slug duy nhất, vui lòng thử lại.', 'slug_conflict', 409);
}

/* ---------- Sửa / lấy / xóa ---------- */

async function getPost(id) {
    const post = await deps.prisma.blogPost.findUnique({ where: { id } });
    if (!post) throw new PostError('Không tìm thấy bài viết.', 'not_found', 404);
    const settings = await deps.newsSettings.get();
    return { post, settings };
}

/** Sửa một phần. Không đổi slug, loại bài, token, ngày trong URL để link đã phát hành không hỏng. */
async function updatePost(id, { body = {}, files = {} }) {
    const { post: current, settings } = await getPost(id);
    const data = {};

    if (body.title !== undefined) {
        const t = content.sanitizeText(body.title, 200);
        if (!t) throw new PostError('title không được để trống.', 'missing_title');
        data.title = t;
    }
    if (body.content !== undefined) {
        const html = content.sanitizeContent(body.content);
        if (!html) throw new PostError('content không được để trống.', 'missing_content');
        data.content = html;
        if (body.summary === undefined && !current.summary) data.summary = summaryFromHtml(html);
    }
    if (body.summary !== undefined) data.summary = content.sanitizeText(body.summary, 500) || null;
    if (body.affiliate_url !== undefined) {
        data.affiliate_url = wrapContent(() => content.validateAffiliateUrl(body.affiliate_url, settings.affiliateHostsRaw));
    }
    if (body.ad_headline !== undefined) data.ad_headline = content.sanitizeText(body.ad_headline, 160) || null;
    if (body.ad_cta_text !== undefined) data.ad_cta_text = content.sanitizeText(body.ad_cta_text, 60) || null;
    if (body.seo_title !== undefined) data.seo_title = content.sanitizeText(body.seo_title, 160) || null;
    if (body.seo_description !== undefined) data.seo_description = content.sanitizeText(body.seo_description, 320) || null;
    if (body.tags !== undefined) {
        data.tags = toList(body.tags).map((t) => content.sanitizeText(t, 40)).filter(Boolean).slice(0, 15).join(',') || null;
    }

    if (body.status !== undefined) {
        const status = str(body.status);
        if (!STATUSES.includes(status)) throw new PostError('status chỉ nhận "draft" hoặc "published".', 'invalid_status');
        data.is_published = status === 'published';
        if (data.is_published && !current.published_at) data.published_at = parseDate(body.published_at) || new Date();
    } else if (body.published_at !== undefined && current.is_published) {
        data.published_at = parseDate(body.published_at) || current.published_at;
    }

    const videoEmbed = body.video_embed_url !== undefined
        ? wrapContent(() => content.normalizeVideoUrl(body.video_embed_url))
        : null;
    if (body.video_embed_url !== undefined && !videoEmbed) data.video_url = null; // chuỗi rỗng = gỡ video

    const wantsMedia = (files.cover || files.images || files.video || files.ad_image) || str(body.cover_url) || toList(body.image_urls).length || str(body.ad_image_url) || videoEmbed;
    let uploaded = [];
    if (wantsMedia) {
        const folder = current.post_type === 'news' ? 'news' : 'blogs';
        const res = await processMedia({ files, body, folder, videoEmbed, needCover: false });
        uploaded = res.uploaded;
        if (res.data.thumbnail_url) data.thumbnail_url = res.data.thumbnail_url;
        if (res.data.gallery) data.gallery = res.data.gallery;
        if (res.data.video_url) data.video_url = res.data.video_url;
        if (res.data.ad_image_url) data.ad_image_url = res.data.ad_image_url;
    }

    if (!Object.keys(data).length) throw new PostError('Không có trường nào để cập nhật.', 'nothing_to_update');

    try {
        const post = await deps.prisma.blogPost.update({ where: { id }, data });
        return { post, settings };
    } catch (e) {
        await cleanup(uploaded);
        throw e;
    }
}

async function deletePost(id) {
    await getPost(id);
    await deps.prisma.blogPost.delete({ where: { id } });
}

module.exports = {
    PostError,
    createPost,
    updatePost,
    getPost,
    deletePost,
    serialize,
    buildPostUrl,
    _deps: deps,
    _resetAuthorCache: () => { cachedAuthorId = null; }
};
