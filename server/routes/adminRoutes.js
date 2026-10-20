const express = require('express');
const multer = require('multer');
const router = express.Router();
const adminController = require('../controllers/adminController');
const {
    verifyToken,
    requireStaff,
    requireSuperAdmin,
    requireUploaderOrAdmin,
    requireBookingsStaff,
    requireManagerOrAdmin,
    requireFinance
} = require('../middleware/authMiddleware');

// Configure multer for in-memory Excel buffer parsing
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// 1. Role-tailored metrics
router.get('/metrics', verifyToken, requireStaff, adminController.getMetrics);

// 2. Staff & RBAC Management (Super Admin only)
router.get('/staff', verifyToken, requireSuperAdmin, adminController.getStaffList);
router.post('/staff/invite', verifyToken, requireSuperAdmin, adminController.inviteOrAssignStaff);
router.patch('/staff/:id/role', verifyToken, requireSuperAdmin, adminController.updateStaffRole);

// 3. Vehicle & Route Management (Admin, Uploader, Moderator)
router.get('/transit/routes', verifyToken, requireUploaderOrAdmin, adminController.getTransitRoutes);
router.post('/transit/routes', verifyToken, requireUploaderOrAdmin, adminController.createTransitRoute);
router.put('/transit/routes/:id', verifyToken, requireUploaderOrAdmin, adminController.updateTransitRoute);
router.delete('/transit/routes/:id', verifyToken, requireUploaderOrAdmin, adminController.deleteTransitRoute);
router.post('/transit/import-excel', verifyToken, requireUploaderOrAdmin, upload.single('file'), adminController.importExcelRoutes);

// 4. Bookings & Operations (Admin, Manager, Accountant, Support)
router.get('/bookings', verifyToken, requireBookingsStaff, adminController.getAllBookings);
router.patch('/bookings/:id/status', verifyToken, requireManagerOrAdmin, adminController.updateBookingStatus);

// 5. Finance & Payments (Admin, Accountant)
router.get('/finance/transactions', verifyToken, requireFinance, adminController.getFinancialTransactions);

module.exports = router;
