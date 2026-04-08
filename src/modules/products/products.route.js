const express = require('express');
const router = express.Router();
const productsController = require('./products.controller');
const { upload } = require('../../middlewares/upload.middleware');

// [GET] /admin/products
router.get('/', productsController.renderList);

// [GET] /admin/products/create
router.get('/create', productsController.renderCreateForm);

// [POST] /admin/products/create
router.post('/create', upload.array('images', 5), productsController.create);

// [GET] /admin/products/edit/:id
router.get('/edit/:id', productsController.renderEditForm);

// [POST] /admin/products/edit/:id
router.post('/edit/:id', upload.array('images', 5), productsController.update);

// [GET] /admin/products/sku-suggest
router.get('/sku-suggest', productsController.getSkuSuggest);

// [GET] /admin/products/slug-suggest
router.get('/slug-suggest', productsController.getSlugSuggest);

// [POST] /admin/products/duplicate/:id
router.post('/duplicate/:id', productsController.duplicate);

// [DELETE] /admin/products/:id
router.delete('/:id', productsController.deleteProduct);

module.exports = router;
