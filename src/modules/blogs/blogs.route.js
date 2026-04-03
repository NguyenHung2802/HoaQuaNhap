const express = require('express');
const router = express.Router();
const blogsController = require('./blogs.controller');
const { upload } = require('../../middlewares/upload.middleware');

// [GET] /admin/blogs
router.get('/', blogsController.renderList);

// [GET] /admin/blogs/create
router.get('/create', blogsController.renderCreate);

// [POST] /admin/blogs
router.post('/', upload.single('thumbnail'), blogsController.createBlog);

// [GET] /admin/blogs/edit/:id
router.get('/edit/:id', blogsController.renderEdit);

// [POST] /admin/blogs/edit/:id
router.post('/edit/:id', upload.single('thumbnail'), blogsController.updateBlog);

// [DELETE] /admin/blogs/:id
router.delete('/:id', blogsController.deleteBlog);

module.exports = router;
