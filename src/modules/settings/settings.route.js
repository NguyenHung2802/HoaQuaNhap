const express = require('express');
const router = express.Router();
const settingsController = require('./settings.controller');

// [GET] /admin/settings/pages
router.get('/pages', settingsController.renderPagesList);

// [GET] /admin/settings/pages/edit/:key
router.get('/pages/edit/:key', settingsController.renderEditPage);

// [POST] /admin/settings/pages/edit/:key
router.post('/pages/edit/:key', settingsController.updatePage);

module.exports = router;
