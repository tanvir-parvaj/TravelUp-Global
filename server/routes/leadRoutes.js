const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const { verifyToken, requireSupportOrAdmin } = require('../middleware/authMiddleware');

router.post('/', leadController.createLead);
router.get('/', verifyToken, requireSupportOrAdmin, leadController.getLeads);
router.patch('/:id/status', verifyToken, requireSupportOrAdmin, leadController.updateLeadStatus);

module.exports = router;
