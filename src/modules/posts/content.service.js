/**
 * Xử lý nội dung bài viết dùng chung cho admin và API (BA v9, S43):
 * làm sạch HTML, sinh slug không dấu, kiểm tra link affiliate, chuẩn hóa video nhúng,
 * sinh token truy cập và ngày trong URL tin ẩn.
 */
const crypto = require('crypto');
const sanitizeHtml = require('sanitize-html');

const DEFAULT_AFFILIATE_HOSTS = [
    'shopee.vn', 's.shopee.vn', 'shope.ee',
    'tiktok.com', 'vt.tiktok.com', 'vm.tiktok.com', 'shop.tiktok.com'
];

const IFRAME_HOSTS = [
    'www.youtube.com', 'www.youtube-nocookie.com',
    'www.tiktok.com', 'www.facebook.com', 'player.vimeo.com'
];

class ContentError extends Error {
    constructor(message, code = 'invalid_content') {
        super(message);
        this.name = 'ContentError';
        this.code = code;
    }
}

/* ---------- Slug ---------- */

/**
 * "Tin dự án đất vùng ven" -> "tin-du-an-dat-vung-ven"
 * Bỏ dấu bằng Unicode NFD (xử lý cả chữ viết hoa và dạng tổ hợp), đ -> d.
 */
function toSlug(text, maxLength = 90) {
    if (!text) return '';
    const slug = String(text)
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/đ/gi, 'd')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return slug.slice(0, maxLength).replace(/-+$/g, '');
}

/**
 * Trả về slug chưa bị dùng; trùng thì thêm hậu tố -2, -3...
 * @param {object} prisma PrismaClient
 * @param {string} base chuỗi gốc (tiêu đề hoặc slug do client gửi)
 * @param {number} [excludeId] bỏ qua bài có id này (khi sửa bài)
 */
async function uniqueSlug(prisma, base, excludeId) {
    const root = toSlug(base) || 'bai-viet';
    for (let i = 1; i <= 50; i++) {
        const candidate = i === 1 ? root : `${root}-${i}`;
        const found = await prisma.blogPost.findUnique({ where: { slug: candidate }, select: { id: true } });
        if (!found || found.id === excludeId) return candidate;
    }
    return `${root}-${crypto.randomBytes(3).toString('hex')}`;
}

/* ---------- Làm sạch HTML ---------- */

const SANITIZE_OPTIONS = {
    allowedTags: [
        'h2', 'h3', 'h4', 'p', 'br', 'hr', 'blockquote', 'pre', 'code',
        'ul', 'ol', 'li', 'strong', 'b', 'em', 'i', 'u', 's', 'span', 'sub', 'sup',
        'a', 'img', 'figure', 'figcaption',
        'table', 'thead', 'tbody', 'tr', 'th', 'td', 'iframe'
    ],
    allowedAttributes: {
        a: ['href', 'title', 'target', 'rel'],
        img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
        iframe: ['src', 'width', 'height', 'allow', 'allowfullscreen', 'frameborder', 'title', 'loading'],
        th: ['colspan', 'rowspan'],
        td: ['colspan', 'rowspan']
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: { img: ['http', 'https'], iframe: ['https'] },
    allowProtocolRelative: false,
    allowedIframeHostnames: IFRAME_HOSTS,
    disallowedTagsMode: 'discard',
    // iframe có host không được phép sẽ bị gỡ src -> bỏ luôn thẻ rỗng
    exclusiveFilter: (frame) => frame.tag === 'iframe' && !frame.attribs.src,
    transformTags: {
        // Link trong bài: mở tab mới, không truyền uy tín và không lộ referrer.
        a: (tagName, attribs) => ({
            tagName,
            attribs: { ...attribs, target: '_blank', rel: 'noopener noreferrer nofollow sponsored' }
        }),
        img: (tagName, attribs) => ({
            tagName,
            attribs: { ...attribs, loading: 'lazy' }
        }),
        iframe: (tagName, attribs) => ({
            tagName,
            attribs: { ...attribs, loading: 'lazy' }
        })
    }
};

function sanitizeContent(html) {
    if (html === undefined || html === null) return '';
    return sanitizeHtml(String(html), SANITIZE_OPTIONS).trim();
}

/** Dùng cho trường chỉ chứa chữ (tiêu đề, tóm tắt, tag...): bỏ toàn bộ thẻ HTML. */
function sanitizeText(text, maxLength = 500) {
    if (text === undefined || text === null) return '';
    const plain = sanitizeHtml(String(text), { allowedTags: [], allowedAttributes: {} });
    return plain.replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function estimateReadMinutes(html) {
    const text = sanitizeHtml(String(html || ''), { allowedTags: [], allowedAttributes: {} });
    const words = text.split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 200));
}

/* ---------- Link affiliate ---------- */

function parseHostList(csv) {
    const list = String(csv || '')
        .split(',')
        .map((h) => h.trim().toLowerCase())
        .filter(Boolean);
    return list.length ? list : DEFAULT_AFFILIATE_HOSTS;
}

/**
 * Chỉ chấp nhận https và host nằm trong danh sách cho phép (khớp chính xác hoặc subdomain).
 * @returns {string|null} URL đã chuẩn hóa, hoặc null nếu rỗng.
 * @throws {ContentError} code = invalid_affiliate_url | affiliate_host_not_allowed
 */
function validateAffiliateUrl(url, allowedHostsCsv) {
    if (url === undefined || url === null || String(url).trim() === '') return null;
    let parsed;
    try {
        parsed = new URL(String(url).trim());
    } catch (e) {
        throw new ContentError('Link affiliate không hợp lệ.', 'invalid_affiliate_url');
    }
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password) {
        throw new ContentError('Link affiliate phải dùng https và không chứa thông tin đăng nhập.', 'invalid_affiliate_url');
    }
    const host = parsed.hostname.toLowerCase();
    const allowed = parseHostList(allowedHostsCsv);
    if (!allowed.some((h) => host === h || host.endsWith('.' + h))) {
        throw new ContentError(`Host "${host}" không nằm trong danh sách affiliate được phép.`, 'affiliate_host_not_allowed');
    }
    return parsed.toString();
}

/* ---------- Video nhúng ---------- */

/**
 * Chuẩn hóa link video thành dạng nhúng an toàn.
 * @returns {{type: 'embed'|'file', url: string}|null}
 */
function normalizeVideoUrl(url) {
    if (url === undefined || url === null || String(url).trim() === '') return null;
    let u;
    try {
        u = new URL(String(url).trim());
    } catch (e) {
        throw new ContentError('Link video không hợp lệ.', 'invalid_video_url');
    }
    if (u.protocol !== 'https:') throw new ContentError('Link video phải dùng https.', 'invalid_video_url');
    const host = u.hostname.toLowerCase().replace(/^www\./, '').replace(/^m\./, '');

    // YouTube
    let id = null;
    if (host === 'youtu.be') id = u.pathname.slice(1).split('/')[0];
    else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
        if (u.pathname === '/watch') id = u.searchParams.get('v');
        else {
            const m = u.pathname.match(/^\/(embed|shorts|live)\/([\w-]{6,})/);
            if (m) id = m[2];
        }
    }
    if (id && /^[\w-]{6,20}$/.test(id)) {
        return { type: 'embed', url: `https://www.youtube-nocookie.com/embed/${id}` };
    }

    // TikTok: https://www.tiktok.com/@user/video/1234567890
    if (host === 'tiktok.com') {
        const m = u.pathname.match(/\/video\/(\d{8,25})/);
        if (m) return { type: 'embed', url: `https://www.tiktok.com/embed/v2/${m[1]}` };
    }

    // Facebook video
    if (host === 'facebook.com' || host === 'fb.watch') {
        const href = encodeURIComponent(u.toString());
        return { type: 'embed', url: `https://www.facebook.com/plugins/video.php?href=${href}&show_text=false` };
    }

    // Video đã nằm trên Cloudinary của mình (sau khi upload)
    if (host === 'res.cloudinary.com' && /\.(mp4|webm|mov)(\?|$)/i.test(u.pathname)) {
        return { type: 'file', url: u.toString() };
    }

    throw new ContentError('Chỉ hỗ trợ link YouTube, TikTok, Facebook hoặc video đã upload.', 'unsupported_video_host');
}

/** JSON an toàn để nhúng trong thẻ <script>: mã hóa < > & thành dạng \uXXXX nên không thoát được khỏi thẻ script. */
function jsonForScript(obj) {
    return JSON.stringify(obj).replace(/[<>&]/g, (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
}

/** Escape ký tự đặc biệt để đặt vào nội dung/thuộc tính HTML. */
function escapeHtml(s) {
    return String(s === undefined || s === null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* ---------- Token và ngày trong URL tin ẩn ---------- */

/** 16 byte ngẫu nhiên -> 22 ký tự base64url. */
function generateAccessToken() {
    return crypto.randomBytes(16).toString('base64url');
}

function isValidAccessToken(token) {
    return typeof token === 'string' && /^[A-Za-z0-9_-]{22}$/.test(token);
}

/** dd-mm-yyyy theo giờ Việt Nam. */
function formatUrlDate(date = new Date()) {
    return new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric'
    }).format(date).replace(/\//g, '-');
}

function isValidUrlDate(s) {
    return typeof s === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(s);
}

module.exports = {
    ContentError,
    DEFAULT_AFFILIATE_HOSTS,
    toSlug,
    uniqueSlug,
    sanitizeContent,
    sanitizeText,
    estimateReadMinutes,
    jsonForScript,
    escapeHtml,
    parseHostList,
    validateAffiliateUrl,
    normalizeVideoUrl,
    generateAccessToken,
    isValidAccessToken,
    formatUrlDate,
    isValidUrlDate
};
