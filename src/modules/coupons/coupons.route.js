const express = require('express');
const router = express.Router();
const couponsController = require('./coupons.controller');

// Admin Coupon Routes
router.get('/', couponsController.renderList);
router.get('/create', couponsController.renderCreateForm);
router.post('/create', couponsController.create);
router.get('/edit/:id', couponsController.renderEditForm);
router.post('/edit/:id', couponsController.update);
router.delete('/:id', couponsController.deleteCoupon);

module.exports = router;
