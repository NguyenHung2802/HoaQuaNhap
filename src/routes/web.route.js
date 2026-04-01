const express = require('express');
const router = express.Router();

const homeController = require('../modules/public/home/home.controller');

router.get('/', homeController.renderHome);

module.exports = router;
