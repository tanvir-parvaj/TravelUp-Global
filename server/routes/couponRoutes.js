const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { verifyToken, requireManagerOrAdmin } = require('../middleware/authMiddleware');

router.get('/', verifyToken, requireManagerOrAdmin, couponController.getAllCoupons);
router.post('/validate', couponController.validateCoupon);

// Protected routes
router.post('/', verifyToken, requireManagerOrAdmin, couponController.createCoupon);
router.delete('/:id', verifyToken, requireManagerOrAdmin, couponController.deleteCoupon);

module.exports = router;
