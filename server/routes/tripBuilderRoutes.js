const express = require('express');
const router = express.Router();
const tripBuilderController = require('../controllers/tripBuilderController');

router.post('/calculate', tripBuilderController.calculateTrip);
router.get('/inventory', tripBuilderController.getInventory);

module.exports = router;
