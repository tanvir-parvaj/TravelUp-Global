const express = require('express');
const router = express.Router();
const visaController = require('../controllers/visaController');
const { verifyToken, requireStaff } = require('../middleware/authMiddleware');

router.get('/', verifyToken, requireStaff, visaController.getAllVisaApplications);
router.post('/', verifyToken, requireStaff, visaController.createVisaApplication);
router.put('/:id/status', verifyToken, requireStaff, visaController.updateVisaStatus);
router.delete('/:id', verifyToken, requireStaff, visaController.deleteVisaApplication);

module.exports = router;
