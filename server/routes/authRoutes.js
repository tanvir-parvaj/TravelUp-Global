const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, requireStaff, requireSuperAdmin } = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', verifyToken, authController.getProfile);
router.put('/profile', verifyToken, authController.updateProfile);
router.get('/users', verifyToken, requireStaff, authController.getAllUsers);
router.post('/users', verifyToken, requireSuperAdmin, authController.adminCreateUser);
router.put('/users/:id', verifyToken, requireSuperAdmin, authController.adminUpdateUser);
router.post('/users/:id/reset-password', verifyToken, requireSuperAdmin, authController.adminResetPassword);
router.patch('/users/:id/role', verifyToken, requireSuperAdmin, authController.updateUserRole);
router.delete('/users/:id', verifyToken, requireSuperAdmin, authController.deleteUser);

module.exports = router;
