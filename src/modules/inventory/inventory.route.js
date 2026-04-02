const express = require('express');
const router = express.Router();
const inventoryController = require('./inventory.controller');

// [GET] /admin/inventory
router.get('/', inventoryController.renderLog);

module.exports = router;
