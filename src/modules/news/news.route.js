const express = require('express');
const router = express.Router();
const controller = require('./news.controller');
const { upload } = require('../../middlewares/upload.middleware');

// Được mount sau isAdmin tại /admin/news
const uploadImages = upload.fields([
    { name: 'cover', maxCount: 1 },
    { name: 'ad_image', maxCount: 1 }
]);

/** Lỗi upload (quá dung lượng, sai trường) -> báo bằng flash thay vì trang 500. */
const withUpload = (back) => (req, res, next) => {
    uploadImages(req, res, (err) => {
        if (!err) return next();
        const msg = err.code === 'LIMIT_FILE_SIZE' ? 'Ảnh vượt quá 5MB.' : 'Upload ảnh không hợp lệ: ' + err.message;
        req.flash('error_msg', msg);
        res.redirect(typeof back === 'function' ? back(req) : back);
    });
};

router.get('/', controller.renderList);
router.get('/settings', controller.renderSettings);
router.post('/settings', controller.saveSettings);
router.get('/create', controller.renderCreate);
router.post('/', withUpload('/admin/news/create'), controller.createNews);
router.get('/preview/:id', controller.renderPreview);
router.get('/stats/:id', controller.renderStats);
router.get('/edit/:id', controller.renderEdit);
router.post('/edit/:id', withUpload((req) => `/admin/news/edit/${req.params.id}`), controller.updateNews);
router.post('/:id/toggle', controller.togglePublish);
router.delete('/:id', controller.deleteNews);

module.exports = router;
