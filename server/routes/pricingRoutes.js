const express = require('express');
const router = express.Router();
const pricingController = require('../controllers/pricingController');

// Live calculation from selected DB components
router.post('/calculate-custom-trip', pricingController.calculateCustomTripPrice);

// Security Price Gate before Booking (Rule #30)
router.post('/validate-booking-price', pricingController.validateBookingPrice);

// Group pricing rules & discount slabs
router.get('/group-rules', pricingController.getGroupPricingRules);

module.exports = router;
