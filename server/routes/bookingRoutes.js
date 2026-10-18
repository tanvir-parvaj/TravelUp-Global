const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bookingController = require('../controllers/bookingController');
const { verifyToken, requireBookingsStaff } = require('../middleware/authMiddleware');

const optionalToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (authHeader) {
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'travelup_secret');
            req.user = decoded;
        } catch (e) {
            // invalid token, ignore
        }
    }
    next();
};

router.post('/', optionalToken, bookingController.createBooking);
router.get('/my', verifyToken, bookingController.getUserBookings);
router.get('/', verifyToken, requireBookingsStaff, bookingController.getAllBookings);
router.get('/all', verifyToken, requireBookingsStaff, bookingController.getAllBookings);
router.patch('/:id/status', verifyToken, requireBookingsStaff, bookingController.updateBookingStatus);

module.exports = router;

