/**
 * Router của host tin ẩn. Chỉ có đúng các đường dẫn dưới đây, mọi thứ khác là 404 trung tính.
 */
const express = require('express');
const path = require('path');
const router = express.Router();
const controller = require('./news.public.controller');

// Tiêu đề chung cho mọi phản hồi của host này
router.use((req, res, next) => {
    res.set({
        'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'X-Content-Type-Options': 'nosniff'
    });
    // Trang bài luôn kiểm tra lại; file tĩnh (news.js) dùng cache 7 ngày của express.static
    if (!req.path.startsWith('/assets/')) res.set('Cache-Control', 'no-cache');
    next();
});

router.get('/robots.txt', controller.robots);

// Chặn sớm khi khu tin ẩn bị tắt, và chặn IP dò đường dẫn quá nhiều
router.use(controller.guard);

router.get('/tin-tuc/:date/:slug/:token', controller.show);
router.post('/t', express.json({ limit: '1kb' }), controller.track);
router.use('/assets', express.static(path.join(__dirname, '../../../../public/news-assets'), { maxAge: '7d', index: false, fallthrough: true }));

router.use(controller.notFound);
router.use(controller.errorHandler);

module.exports = router;
