const express = require('express');
const router = express.Router();
const ordersController = require('../modules/orders/orders.controller');
const couponsController = require('../modules/coupons/coupons.controller');

// Đặt hàng nhanh (Guest)
router.post('/orders/quick-checkout', ordersController.quickCheckout);

// Coupons
router.post('/coupons/apply', couponsController.applyCoupon);

module.exports = router;
