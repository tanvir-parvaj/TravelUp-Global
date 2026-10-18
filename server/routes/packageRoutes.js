const express = require('express');
const router = express.Router();
const packageController = require('../controllers/packageController');
const { verifyToken, requireManagerOrAdmin, requireSuperAdmin } = require('../middleware/authMiddleware');

router.get('/', packageController.getPackages);
router.get('/:id', packageController.getPackageById);
router.post('/calculate', packageController.calculatePackagePrice);
router.post('/', verifyToken, requireManagerOrAdmin, packageController.createPackage);
router.delete('/:id', verifyToken, requireSuperAdmin, packageController.deletePackage);

module.exports = router;

