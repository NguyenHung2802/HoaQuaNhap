const express = require('express');
const router = express.Router();
const profileController = require('./profile.controller');
const { ensureAuthenticated } = require('../../../middlewares/auth.middleware');
const multer = require('multer');

// Cấu hình multer để xử lý file upload (nhận từ memory)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Render trang Profile - Yêu cầu đăng nhập
router.get('/', ensureAuthenticated, profileController.renderProfile);

// Cập nhật thông tin cơ bản
router.post('/update', ensureAuthenticated, profileController.updateProfile);

// API Upload Avatar
router.post('/avatar-upload', ensureAuthenticated, upload.single('avatar'), profileController.uploadAvatar);

// API Quản lý địa chỉ
router.post('/address/save', ensureAuthenticated, profileController.saveAddress);
router.post('/address/delete/:id', ensureAuthenticated, profileController.deleteAddress);
router.post('/address/default/:id', ensureAuthenticated, profileController.setDefaultAddress);

module.exports = router;
