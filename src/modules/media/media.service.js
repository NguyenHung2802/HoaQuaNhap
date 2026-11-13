/**
 * Upload ảnh/video lên Cloudinary theo dạng stream (BA v9, S43).
 * - Không ghi đĩa VPS, không chuyển base64 (tiết kiệm RAM trên VPS 1GB).
 * - Kiểm tra loại file bằng magic bytes, giới hạn dung lượng, giới hạn số upload đồng thời.
 */
const { Readable } = require('stream');
const cloudinary = require('../../config/cloudinary');

const LIMITS = {
    IMAGE_BYTES: 8 * 1024 * 1024,
    VIDEO_BYTES: 20 * 1024 * 1024,
    MAX_CONCURRENT: 2,
    QUEUE_TIMEOUT_MS: 15000
};

class MediaError extends Error {
    constructor(message, code = 'media_error', status = 400) {
        super(message);
        this.name = 'MediaError';
        this.code = code;
        this.status = status;
    }
}

/* ---------- Giới hạn số upload đồng thời ---------- */
let running = 0;
const waiting = [];

function acquire() {
    if (running < LIMITS.MAX_CONCURRENT) {
        running++;
        return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
        const entry = { resolve };
        entry.timer = setTimeout(() => {
            const i = waiting.indexOf(entry);
            if (i >= 0) waiting.splice(i, 1);
            reject(new MediaError('Hệ thống đang xử lý nhiều upload, vui lòng thử lại sau.', 'upload_busy', 503));
        }, LIMITS.QUEUE_TIMEOUT_MS);
        waiting.push(entry);
    });
}

function release() {
    const next = waiting.shift();
    if (next) {
        clearTimeout(next.timer);
        next.resolve(); // chuyển suất chạy cho người đợi, running giữ nguyên
    } else {
        running = Math.max(0, running - 1);
    }
}

/* ---------- Nhận diện loại file ---------- */

function detectKind(buf) {
    if (!buf || buf.length < 12) return null;
    if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image'; // jpeg
    if (buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image'; // png
    if (buf.slice(0, 3).toString('latin1') === 'GIF') return 'image';
    if (buf.slice(0, 4).toString('latin1') === 'RIFF' && buf.slice(8, 12).toString('latin1') === 'WEBP') return 'image';
    if (buf.slice(4, 8).toString('latin1') === 'ftyp') return 'video'; // mp4/mov
    if (buf.slice(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) return 'video'; // webm/mkv
    return null;
}

function streamUpload(buffer, options) {
    return new Promise((resolve, reject) => {
        const up = cloudinary.uploader.upload_stream(options, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
        Readable.from(buffer).pipe(up);
    });
}

async function guarded(fn) {
    await acquire();
    try {
        return await fn();
    } finally {
        release();
    }
}

/* ---------- API công khai ---------- */

/** Upload ảnh từ buffer (đã nằm trong RAM do multer). Trả về secure_url, public_id, width, height. */
async function uploadImageBuffer(buffer, folder = 'posts') {
    if (!buffer || !buffer.length) throw new MediaError('File ảnh rỗng.', 'empty_file');
    if (buffer.length > LIMITS.IMAGE_BYTES) {
        throw new MediaError('Ảnh vượt quá 8MB.', 'file_too_large', 413);
    }
    if (detectKind(buffer) !== 'image') {
        throw new MediaError('Định dạng ảnh không được hỗ trợ (chỉ JPG, PNG, GIF, WEBP).', 'unsupported_media', 415);
    }
    const r = await guarded(() => streamUpload(buffer, { folder, resource_type: 'image' }));
    return { url: r.secure_url, public_id: r.public_id, width: r.width, height: r.height };
}

/** Upload video mp4/webm tối đa 20MB, đẩy thẳng lên Cloudinary. */
async function uploadVideoBuffer(buffer, folder = 'posts/video') {
    if (!buffer || !buffer.length) throw new MediaError('File video rỗng.', 'empty_file');
    if (buffer.length > LIMITS.VIDEO_BYTES) {
        throw new MediaError('Video vượt quá 20MB. Hãy dùng link YouTube/TikTok thay thế.', 'file_too_large', 413);
    }
    if (detectKind(buffer) !== 'video') {
        throw new MediaError('Định dạng video không được hỗ trợ (chỉ MP4, WEBM).', 'unsupported_media', 415);
    }
    const r = await guarded(() => streamUpload(buffer, { folder, resource_type: 'video' }));
    return { url: r.secure_url, public_id: r.public_id, bytes: r.bytes, duration: r.duration };
}

/** Kiểm tra URL ảnh từ xa: chỉ https, không localhost/IP nội bộ (Cloudinary tự tải ảnh về). */
function assertRemoteImageUrl(url) {
    let u;
    try {
        u = new URL(String(url));
    } catch (e) {
        throw new MediaError('URL ảnh không hợp lệ.', 'invalid_url');
    }
    const host = u.hostname.toLowerCase();
    const isIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(':');
    if (u.protocol !== 'https:' || isIp || host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal') || !host.includes('.')) {
        throw new MediaError('URL ảnh phải là https công khai (không dùng IP hoặc localhost).', 'invalid_url');
    }
    return u.toString();
}

/** Upload ảnh theo URL: Cloudinary tải về từ phía họ, VPS không tốn RAM hay băng thông. */
async function uploadImageFromUrl(url, folder = 'posts') {
    const safe = assertRemoteImageUrl(url);
    try {
        const r = await guarded(() => cloudinary.uploader.upload(safe, { folder, resource_type: 'image' }));
        return { url: r.secure_url, public_id: r.public_id, width: r.width, height: r.height };
    } catch (e) {
        if (e instanceof MediaError) throw e;
        throw new MediaError('Không tải được ảnh từ URL đã cung cấp.', 'remote_fetch_failed', 422);
    }
}

/** Chèn tham số tối ưu (định dạng và chất lượng tự động) vào URL ảnh Cloudinary khi hiển thị. */
function optimizeImageUrl(url, width) {
    if (!url || !/^https:\/\/res\.cloudinary\.com\/.+\/image\/upload\//.test(url)) return url;
    if (/\/image\/upload\/[^/]*(f_auto|q_auto)/.test(url)) return url;
    const t = `f_auto,q_auto${width ? ',w_' + width : ''}`;
    return url.replace('/image/upload/', `/image/upload/${t}/`);
}

module.exports = {
    LIMITS,
    MediaError,
    detectKind,
    uploadImageBuffer,
    uploadVideoBuffer,
    uploadImageFromUrl,
    assertRemoteImageUrl,
    optimizeImageUrl
};
