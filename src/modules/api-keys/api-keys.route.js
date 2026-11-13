const express = require('express');
const router = express.Router();
const controller = require('./api-keys.controller');

// Được mount sau isAdmin tại /admin/api-keys
router.get('/', controller.renderList);
router.post('/', controller.createKey);
router.post('/:id/revoke', controller.revokeKey);

module.exports = router;
