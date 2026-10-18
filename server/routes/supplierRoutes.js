const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { verifyToken, requireManagerOrAdmin } = require('../middleware/authMiddleware');

// Protected Admin/Operations routes
router.get('/', verifyToken, requireManagerOrAdmin, supplierController.getAllSuppliers);
router.get('/:id', verifyToken, requireManagerOrAdmin, supplierController.getSupplierById);

// Protected Admin/Operations routes
router.post('/', verifyToken, requireManagerOrAdmin, supplierController.createSupplier);
router.put('/:id', verifyToken, requireManagerOrAdmin, supplierController.updateSupplier);
router.put('/:id/status', verifyToken, requireManagerOrAdmin, supplierController.toggleSupplierStatus);
router.delete('/:id', verifyToken, requireManagerOrAdmin, supplierController.deleteSupplier);

module.exports = router;
