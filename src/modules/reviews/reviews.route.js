const express = require('express');
const router = express.Router();
const reviewsController = require('./reviews.controller');

// [GET] /admin/reviews
router.get('/', reviewsController.renderList);

// [POST] /admin/reviews/approve/:id
router.post('/approve/:id', reviewsController.approveReview);

// [POST] /admin/reviews/toggle/:id
router.post('/toggle/:id', reviewsController.toggleVisibility);

// [DELETE] /admin/reviews/:id
router.delete('/:id', reviewsController.deleteReview);

module.exports = router;
