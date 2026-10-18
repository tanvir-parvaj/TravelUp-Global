const express = require('express');
const router = express.Router();
const componentController = require('../controllers/componentController');

// Destination ecosystem (single call for trip builder)
router.get('/ecosystem/:destinationId', componentController.getDestinationEcosystem);

// Specific component collections
router.get('/hotels', componentController.getHotels);
router.get('/activities', componentController.getActivities);
router.get('/transportation', componentController.getTransportation);

module.exports = router;
