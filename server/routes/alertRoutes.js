const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/', alertController.getActiveAlerts);
router.post('/', verifyToken, requireAdmin, alertController.createAlert);

module.exports = router;
