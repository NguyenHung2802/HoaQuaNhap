const express = require('express');
const router = express.Router();

const homeController = require('../modules/public/home/home.controller');
const authRoutes = require('../modules/auth/auth.route');
const ordersController = require('../modules/orders/orders.controller');
const publicProductsController = require('../modules/public/products/products.controller');
const cartRoutes = require('../modules/public/cart/cart.route');
const checkoutRoutes = require('../modules/public/checkout/checkout.route');
const blogsRoute = require('../modules/public/blogs/blogs.route');
const pagesController = require('../modules/public/pages/pages.controller');

router.get('/', homeController.renderHome);
router.use('/auth', authRoutes);

// Shop Pages
router.get('/products', publicProductsController.renderShop);
router.get('/product/:slug', publicProductsController.renderDetail);

// Blog Pages
router.use('/blog', blogsRoute);
router.use('/blogs', blogsRoute);

// Static Pages
router.get('/about', (req, res, next) => { req.params.key = 'about_us'; pagesController.renderPage(req, res, next); });
router.get('/faq', (req, res, next) => { req.params.key = 'faq'; pagesController.renderPage(req, res, next); });
router.get('/policy', (req, res, next) => { req.params.key = 'shipping_policy'; pagesController.renderPage(req, res, next); });
router.get('/privacy', (req, res, next) => { req.params.key = 'privacy_policy'; pagesController.renderPage(req, res, next); });
router.get('/page/:key', pagesController.renderPage);

// Product Reviews
router.post('/product/:id/review', publicProductsController.submitReview);

// Cart & Checkout Pages
router.use('/cart', cartRoutes);
router.use('/checkout', checkoutRoutes);

// Checkout Success
router.get('/checkout/success/:orderCode', ordersController.renderSuccess);

module.exports = router;
