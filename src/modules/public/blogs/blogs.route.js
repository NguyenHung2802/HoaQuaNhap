const express = require('express');
const router = express.Router();
const blogsController = require('./blogs.controller');

// [GET] /blogs
router.get('/', blogsController.renderList);

// [GET] /blog/:slug
router.get('/:slug', blogsController.renderDetail);

module.exports = router;
