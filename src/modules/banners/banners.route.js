const express = require('express');
const router = express.Router();
const bannersController = require('./banners.controller');
const { upload } = require('../../middlewares/upload.middleware');

// [GET] /admin/banners
router.get('/', bannersController.renderList);

// [GET] /admin/banners/create
router.get('/create', bannersController.renderCreate);

// [POST] /admin/banners
router.post('/', upload.single('image'), bannersController.createBanner);

// [GET] /admin/banners/edit/:id
router.get('/edit/:id', bannersController.renderEdit);

// [POST] /admin/banners/edit/:id
router.post('/edit/:id', upload.single('image'), bannersController.updateBanner);

// [DELETE] /admin/banners/:id
router.delete('/:id', bannersController.deleteBanner);

module.exports = router;
