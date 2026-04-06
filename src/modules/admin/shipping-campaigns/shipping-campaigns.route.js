const express = require('express');
const router = express.Router();
const shippingCampaignsController = require('./shipping-campaigns.controller');

// [GET] /admin/shipping-campaigns
router.get('/', shippingCampaignsController.renderList);

// [GET] /admin/shipping-campaigns/create
router.get('/create', shippingCampaignsController.renderCreateForm);

// [POST] /admin/shipping-campaigns/create
router.post('/create', shippingCampaignsController.create);

// [GET] /admin/shipping-campaigns/edit/:id
router.get('/edit/:id', shippingCampaignsController.renderEditForm);

// [POST] /admin/shipping-campaigns/edit/:id
router.post('/edit/:id', shippingCampaignsController.update);

// [DELETE] /admin/shipping-campaigns/:id
router.delete('/:id', shippingCampaignsController.deleteCampaign);

module.exports = router;
