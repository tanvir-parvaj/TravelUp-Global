const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');

router.get('/', alertController.getActiveAlerts);
router.post('/broadcast', alertController.broadcastAlert);

module.exports = router;
