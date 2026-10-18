const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { 
    verifyToken, 
    requireStaff, 
    requireFinance, 
    requireManagerOrAdmin 
} = require('../middleware/authMiddleware');

router.get('/analytics', verifyToken, requireStaff, adminController.getAnalytics);
router.get('/financials', verifyToken, requireFinance, adminController.getFinancials);
router.get('/pricing/components', verifyToken, requireManagerOrAdmin, adminController.getPricingComponents);
router.post('/pricing/update', verifyToken, requireManagerOrAdmin, adminController.updateComponentPrice);
router.get('/pricing/audit-logs', verifyToken, requireManagerOrAdmin, adminController.getAuditLogs);

module.exports = router;
