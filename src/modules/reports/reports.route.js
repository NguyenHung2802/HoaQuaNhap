const express = require('express');
const router = express.Router();
const reportsController = require('./reports.controller');

router.get('/revenue', reportsController.renderRevenueReport);
router.get('/insights', reportsController.renderInsightsReport);

module.exports = router;
