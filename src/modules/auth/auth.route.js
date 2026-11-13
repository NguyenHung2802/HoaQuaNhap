const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { loginThrottle } = require('../../middlewares/login-throttle.middleware');

// Đăng nhập
router.get('/login', authController.renderLogin);
router.post('/login', loginThrottle, authController.login);

// Đăng ký
router.get('/register', authController.renderRegister);
router.post('/register', authController.register);

// Đăng xuất
router.post('/logout', authController.logout);

module.exports = router;
