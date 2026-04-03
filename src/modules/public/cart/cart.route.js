const express = require('express');
const router = express.Router();
const cartController = require('./cart.controller');

// Apply initCart middleware to all cart routes
router.use(cartController.initCart);

// [GET] /cart
router.get('/', cartController.renderCart);

// [GET] /cart/count
router.get('/count', cartController.getCartCount);

// [POST] /cart/add
router.post('/add', cartController.addToCart);

// [POST] /cart/update
router.post('/update', cartController.updateCart);

// [POST] /cart/remove
router.post('/remove', cartController.removeFromCart);

module.exports = router;
