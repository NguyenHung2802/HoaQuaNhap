const express = require('express');
const router = express.Router();
const ordersController = require('../modules/orders/orders.controller');
const couponsController = require('../modules/coupons/coupons.controller');
const contactsController = require('../modules/contacts/contacts.controller');

// Đặt hàng nhanh (Guest)
router.post('/orders/quick-checkout', ordersController.quickCheckout);

// Coupons
router.post('/coupons/apply', couponsController.applyCoupon);

// Contact Request
router.post('/contacts', contactsController.submitContactForm);

// Wishlist
const wishlistController = require('../modules/wishlist/wishlist.controller');
router.post('/wishlist/toggle/:productId', wishlistController.toggleWishlist);

module.exports = router;
