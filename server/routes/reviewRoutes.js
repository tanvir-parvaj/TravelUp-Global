const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { verifyToken, requireContentStaff } = require('../middleware/authMiddleware');

router.get('/', reviewController.getAllReviews);
router.post('/', verifyToken, reviewController.createReview);
router.delete('/:id', verifyToken, requireContentStaff, reviewController.deleteReview);

module.exports = router;
