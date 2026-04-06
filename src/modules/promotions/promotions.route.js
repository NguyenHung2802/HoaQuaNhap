const express = require('express');
const router = express.Router();
const promotionsController = require('./promotions.controller');

// [GET] /admin/promotions
router.get('/', promotionsController.renderList);

// [GET] /admin/promotions/create
router.get('/create', promotionsController.renderCreateForm);

// [POST] /admin/promotions/create
router.post('/create', promotionsController.create);

// [GET] /admin/promotions/edit/:id
router.get('/edit/:id', promotionsController.renderEditForm);

// [POST] /admin/promotions/edit/:id
router.post('/edit/:id', promotionsController.update);

// [DELETE] /admin/promotions/:id
router.delete('/:id', promotionsController.deletePromotion);

module.exports = router;
