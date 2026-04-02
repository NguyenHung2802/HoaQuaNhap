const express = require('express');
const router = express.Router();
const categoriesController = require('./categories.controller');
const { upload } = require('../../middlewares/upload.middleware');

// [GET] /admin/categories
router.get('/', categoriesController.renderList);

// [GET] /admin/categories/create
router.get('/create', categoriesController.renderCreateForm);

// [POST] /admin/categories/create
router.post('/create', upload.single('image'), categoriesController.create);

// [GET] /admin/categories/edit/:id
router.get('/edit/:id', categoriesController.renderEditForm);

// [POST] /admin/categories/edit/:id
router.post('/edit/:id', upload.single('image'), categoriesController.update);

// [DELETE] /admin/categories/:id
router.delete('/:id', categoriesController.deleteCategory);

module.exports = router;
