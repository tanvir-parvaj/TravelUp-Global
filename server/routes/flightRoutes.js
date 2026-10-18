const express = require('express');
const router = express.Router();
const flightController = require('../controllers/flightController');
const { verifyToken, requireManagerOrAdmin } = require('../middleware/authMiddleware');

router.get('/', flightController.getAllFlights);
router.get('/:id', flightController.getFlightById);

// Protected routes
router.post('/', verifyToken, requireManagerOrAdmin, flightController.createFlight);
router.put('/:id', verifyToken, requireManagerOrAdmin, flightController.updateFlight);
router.put('/:id/status', verifyToken, requireManagerOrAdmin, flightController.toggleFlightStatus);
router.delete('/:id', verifyToken, requireManagerOrAdmin, flightController.deleteFlight);

module.exports = router;
