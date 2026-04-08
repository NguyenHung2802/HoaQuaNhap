const express = require('express');
const router = express.Router();
const wishlistController = require('./wishlist.controller');

// API to toggle wishlist
router.post('/toggle/:productId', wishlistController.toggleWishlist);

// View wishlist page
router.get('/', wishlistController.renderWishlistPage);

module.exports = router;
