const express = require('express');
const router = express.Router();
const blogsController = require('./blogs.controller');
const { upload } = require('../../middlewares/upload.middleware');

// Ảnh chính (thumbnail, 1 ảnh) + ảnh phụ (gallery, tối đa 5 ảnh)
const uploadFields = upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'gallery', maxCount: 5 }
]);

/** Lỗi upload (quá dung lượng, sai trường) -> báo bằng flash thay vì trang 500. */
const withUpload = (back) => (req, res, next) => {
    uploadFields(req, res, (err) => {
        if (!err) return next();
        console.log('[DEBUG withUpload ERROR]', err.code, err.message); // DEBUG TẠM THỜI, xoá sau khi tìm ra lỗi 413/mất ảnh
        const msg = err.code === 'LIMIT_FILE_SIZE' ? 'Ảnh vượt quá 5MB, hãy chọn ảnh nhẹ hơn.'
            : (err.code === 'LIMIT_FIELD_VALUE' ? 'Nội dung bài viết quá nặng (có thể do ảnh chèn trực tiếp). Hãy xoá bớt ảnh trong nội dung rồi chèn lại bằng nút ảnh trên thanh công cụ.'
            : 'Upload ảnh không hợp lệ: ' + err.message);
        req.flash('error_msg', msg);
        res.redirect(typeof back === 'function' ? back(req) : back);
    });
};

// [GET] /admin/blogs
router.get('/', blogsController.renderList);

// [GET] /admin/blogs/create
router.get('/create', blogsController.renderCreate);

// [POST] /admin/blogs/upload-image — Quill chèn ảnh trong nội dung, upload Cloudinary thay vì base64
router.post('/upload-image', upload.single('image'), blogsController.uploadInlineImage);

// [POST] /admin/blogs
router.post('/', withUpload('/admin/blogs/create'), blogsController.createBlog);

// [GET] /admin/blogs/edit/:id
router.get('/edit/:id', blogsController.renderEdit);

// [POST] /admin/blogs/edit/:id
router.post('/edit/:id', withUpload((req) => `/admin/blogs/edit/${req.params.id}`), blogsController.updateBlog);

// [DELETE] /admin/blogs/:id
router.delete('/:id', blogsController.deleteBlog);

module.exports = router;
