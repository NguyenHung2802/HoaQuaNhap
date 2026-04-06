const express = require('express');
const router = express.Router();
const dashboardController = require('../modules/admin/dashboard/dashboard.controller');
const orderController = require('../modules/admin/orders/orders.controller');
const { isAdmin } = require('../middlewares/auth.middleware');

const categoriesRoute = require('../modules/categories/categories.route');
const productsRoute = require('../modules/products/products.route');
const inventoryRoute = require('../modules/inventory/inventory.route');
const adminOrdersRoute = require('../modules/admin/orders/orders.route');
const bannersRoute = require('../modules/banners/banners.route');
const blogsRoute = require('../modules/blogs/blogs.route');
const reviewsRoute = require('../modules/reviews/reviews.route');
const settingsRoute = require('../modules/settings/settings.route');
const couponsRoute = require('../modules/coupons/coupons.route');
const promotionsRoute = require('../modules/promotions/promotions.route');
const customersRoute = require('../modules/customers/customers.route');
const reportsRoute = require('../modules/reports/reports.route');

// [GET] /admin/login (Redirect to unified login)
router.get('/login', (req, res) => res.redirect('/auth/login'));

// [GET] /admin/logout (Redirect to unified logout)
router.get('/logout', (req, res) => res.redirect('/auth/logout'));

// [GET] /admin - Dashboard
router.get('/', isAdmin, dashboardController.renderDashboard);

const shippingCampaignsRoute = require('../modules/admin/shipping-campaigns/shipping-campaigns.route');

// Modules
router.use('/categories', isAdmin, categoriesRoute);
router.use('/products', isAdmin, productsRoute);
router.use('/inventory', isAdmin, inventoryRoute);
router.use('/orders', isAdmin, adminOrdersRoute);
router.use('/banners', isAdmin, bannersRoute);
router.use('/blogs', isAdmin, blogsRoute);
router.use('/reviews', isAdmin, reviewsRoute);
router.use('/settings', isAdmin, settingsRoute);
router.use('/coupons', isAdmin, couponsRoute);
router.use('/promotions', isAdmin, promotionsRoute);
router.use('/shipping-campaigns', isAdmin, shippingCampaignsRoute);
router.use('/customers', isAdmin, customersRoute);
router.use('/reports', isAdmin, reportsRoute);

module.exports = router;
