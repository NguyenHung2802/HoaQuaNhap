const express = require('express');
const router = express.Router();
const checkoutController = require('./checkout.controller');

// Need access to cart init just in case
const cartController = require('../cart/cart.controller');
router.use(cartController.initCart);

// [GET] /checkout
router.get('/', checkoutController.renderCheckout);

// [POST] /checkout/place-order
router.post('/place-order', checkoutController.placeOrder);

module.exports = router;
