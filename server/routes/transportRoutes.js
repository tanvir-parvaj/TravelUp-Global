const express = require('express');
const router = express.Router();
const transportController = require('../controllers/transportController');
const { verifyToken, requireManagerOrAdmin } = require('../middleware/authMiddleware');

router.get('/', transportController.getAllTransport);
router.post('/', verifyToken, requireManagerOrAdmin, transportController.createTransport);
router.put('/:id', verifyToken, requireManagerOrAdmin, transportController.updateTransport);
router.put('/:id/status', verifyToken, requireManagerOrAdmin, transportController.toggleTransportStatus);
router.delete('/:id', verifyToken, requireManagerOrAdmin, transportController.deleteTransport);

module.exports = router;
