const express = require('express');
const router = express.Router();
const ordersController = require('../modules/orders/orders.controller');

// Đặt hàng nhanh (Guest)
router.post('/orders/quick-checkout', ordersController.quickCheckout);

module.exports = router;
