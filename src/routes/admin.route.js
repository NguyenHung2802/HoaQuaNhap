const express = require('express');
const router = express.Router();
const dashboardController = require('../modules/admin/dashboard/dashboard.controller');
const authController = require('../modules/admin/auth/auth.controller');
const { isAdmin } = require('../middlewares/auth.middleware');

// [GET] /admin/login
router.get('/login', authController.renderLogin);

// [POST] /admin/login
router.post('/login', authController.login);

// [GET] /admin/logout
router.get('/logout', isAdmin, authController.logout);

// [GET] /admin - Dashboard
router.get('/', isAdmin, dashboardController.renderDashboard);

module.exports = router;
