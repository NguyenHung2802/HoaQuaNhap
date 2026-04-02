const express = require('express');
const router = express.Router();
const dashboardController = require('../modules/admin/dashboard/dashboard.controller');
const orderController = require('../modules/admin/orders/orders.controller');
const { isAdmin } = require('../middlewares/auth.middleware');

const categoriesRoute = require('../modules/categories/categories.route');
const productsRoute = require('../modules/products/products.route');
const inventoryRoute = require('../modules/inventory/inventory.route');

// [GET] /admin/login (Redirect to unified login)
router.get('/login', (req, res) => res.redirect('/auth/login'));

// [GET] /admin/logout (Redirect to unified logout)
router.get('/logout', (req, res) => res.redirect('/auth/logout'));

// [GET] /admin - Dashboard
router.get('/', isAdmin, dashboardController.renderDashboard);

// Modules
router.use('/categories', isAdmin, categoriesRoute);
router.use('/products', isAdmin, productsRoute);
router.use('/inventory', isAdmin, inventoryRoute);

module.exports = router;
