const express = require('express');
const router = express.Router();

const homeController = require('../modules/public/home/home.controller');
const authRoutes = require('../modules/auth/auth.route');
const ordersController = require('../modules/orders/orders.controller');
const publicProductsController = require('../modules/public/products/products.controller');

router.get('/', homeController.renderHome);
router.use('/auth', authRoutes);

// Shop Pages
router.get('/products', publicProductsController.renderShop);
router.get('/product/:slug', publicProductsController.renderDetail);

// Checkout Success
router.get('/checkout/success/:orderCode', ordersController.renderSuccess);

module.exports = router;
