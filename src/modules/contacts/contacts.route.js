const express = require('express');
const router = express.Router();
const contactsController = require('./contacts.controller');

// [GET] /admin/contacts
router.get('/', contactsController.renderAdminContacts);

// [POST] /admin/contacts/:id/status
router.post('/:id/status', contactsController.updateStatus);

module.exports = router;
