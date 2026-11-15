const express = require('express');
const router = express.Router();
const blogsController = require('./blogs.controller');
const { upload } = require('../../middlewares/upload.middleware');

// Ảnh chính (thumbnail, 1 ảnh) + ảnh phụ (gallery, tối đa 5 ảnh)
const uploadFields = upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'gallery', maxCount: 5 }
]);

// [GET] /admin/blogs
router.get('/', blogsController.renderList);

// [GET] /admin/blogs/create
router.get('/create', blogsController.renderCreate);

// [POST] /admin/blogs
router.post('/', uploadFields, blogsController.createBlog);

// [GET] /admin/blogs/edit/:id
router.get('/edit/:id', blogsController.renderEdit);

// [POST] /admin/blogs/edit/:id
router.post('/edit/:id', uploadFields, blogsController.updateBlog);

// [DELETE] /admin/blogs/:id
router.delete('/:id', blogsController.deleteBlog);

module.exports = router;
