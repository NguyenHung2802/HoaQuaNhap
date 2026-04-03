const express = require('express');
const router = express.Router();
const ordersController = require('./orders.controller');

// [GET] /admin/orders
router.get('/', ordersController.renderList);

// [GET] /admin/orders/:id
router.get('/:id', ordersController.renderDetail);

// [POST] /admin/orders/:id/status
router.post('/:id/status', ordersController.updateStatus);

module.exports = router;
