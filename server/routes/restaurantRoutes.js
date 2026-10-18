const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurantController');
const { verifyToken, requireManagerOrAdmin } = require('../middleware/authMiddleware');

router.get('/', restaurantController.getAllRestaurants);
router.get('/:id', restaurantController.getRestaurantById);

// Protected routes
router.post('/', verifyToken, requireManagerOrAdmin, restaurantController.createRestaurant);
router.put('/:id', verifyToken, requireManagerOrAdmin, restaurantController.updateRestaurant);
router.put('/:id/status', verifyToken, requireManagerOrAdmin, restaurantController.toggleRestaurantStatus);
router.delete('/:id', verifyToken, requireManagerOrAdmin, restaurantController.deleteRestaurant);

module.exports = router;
