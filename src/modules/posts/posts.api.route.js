/**
 * API đăng bài cho tích hợp ngoài (n8n). Mount tại /api/v1/posts.
 *   POST   /            tạo bài (JSON hoặc multipart/form-data)
 *   GET    /:id         xem bài
 *   PUT    /:id         sửa một phần
 *   DELETE /:id         xóa bài
 */
const express = require('express');
const multer = require('multer');
const router = express.Router();

const { apiKeyAuth, perKeyLimiter } = require('../../middlewares/api-key.middleware');
const { LIMITS } = require('../media/media.service');
const postsService = require('./posts.service');

const uploadFields = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: LIMITS.VIDEO_BYTES, files: 12, fields: 40, fieldSize: 2 * 1024 * 1024 }
}).fields([
    { name: 'cover', maxCount: 1 },
    { name: 'images', maxCount: 10 },
    { name: 'video', maxCount: 1 }
]);

const sendError = (res, status, code, message) => res.status(status).json({ error: { code, message } });

/** Chỉ chạy multer khi request là multipart; đổi lỗi multer sang JSON. */
function parseMultipart(req, res, next) {
    if (!req.is('multipart/form-data')) return next();
    uploadFields(req, res, (err) => {
        if (!err) return next();
        if (err.code === 'LIMIT_FILE_SIZE') return sendError(res, 413, 'file_too_large', 'File vượt quá dung lượng cho phép (ảnh 8MB, video 20MB).');
        if (err.code === 'LIMIT_UNEXPECTED_FILE') return sendError(res, 400, 'unexpected_file', 'Chỉ nhận các trường file: cover, images, video.');
        if (err.name === 'MulterError') return sendError(res, 400, 'invalid_multipart', err.message);
        return next(err);
    });
}

const parseId = (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
        sendError(res, 400, 'invalid_id', 'id không hợp lệ.');
        return null;
    }
    return id;
};

const handle = (fn) => async (req, res, next) => {
    try {
        await fn(req, res);
    } catch (e) {
        if (e instanceof postsService.PostError) return sendError(res, e.status, e.code, e.message);
        next(e);
    }
};

router.use(apiKeyAuth('posts:write'), perKeyLimiter);

router.post('/', parseMultipart, handle(async (req, res) => {
    const { post, settings, created } = await postsService.createPost({ body: req.body || {}, files: req.files || {} });
    res.status(created ? 201 : 200).json(postsService.serialize(post, settings, created));
}));

router.get('/:id', handle(async (req, res) => {
    const id = parseId(req, res);
    if (!id) return;
    const { post, settings } = await postsService.getPost(id);
    res.json(postsService.serialize(post, settings));
}));

router.put('/:id', parseMultipart, handle(async (req, res) => {
    const id = parseId(req, res);
    if (!id) return;
    const { post, settings } = await postsService.updatePost(id, { body: req.body || {}, files: req.files || {} });
    res.json(postsService.serialize(post, settings));
}));

router.delete('/:id', handle(async (req, res) => {
    const id = parseId(req, res);
    if (!id) return;
    await postsService.deletePost(id);
    res.status(204).end();
}));

module.exports = router;
