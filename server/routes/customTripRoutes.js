const express = require('express');
const router = express.Router();
const customTripController = require('../controllers/customTripController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/', customTripController.saveCustomTrip);
router.get('/my', verifyToken, customTripController.getUserCustomTrips);
router.get('/:id', customTripController.getCustomTrip);
router.delete('/:id', verifyToken, customTripController.deleteCustomTrip);
router.post('/optimize', customTripController.optimizeTrip);

module.exports = router;
