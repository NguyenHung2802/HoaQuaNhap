const express = require('express');
const router = express.Router();
const controller = require('./customers.controller');

// [GET] /admin/customers - List
router.get('/', controller.renderList);

// [GET] /admin/customers/:id - Detail
router.get('/:id', controller.renderDetail);

// [GET] /admin/customers/:id/edit - Edit form
router.get('/:id/edit', controller.renderEdit);

// [POST] /admin/customers/:id/update - Update
router.post('/:id/update', controller.updateCustomer);

// [POST] /admin/customers/:id/delete - Delete
router.post('/:id/delete', controller.deleteCustomer);

module.exports = router;
