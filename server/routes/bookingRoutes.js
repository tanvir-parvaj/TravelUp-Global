const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

router.post('/', bookingController.createBooking);
router.get('/my-bookings', bookingController.getUserBookings);
router.get('/split/:ref', bookingController.getSplitBillStatus);
router.post('/split/:ref/pay', bookingController.paySplitShare);

module.exports = router;
