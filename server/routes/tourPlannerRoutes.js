const express = require('express');
const router = express.Router();
const tourPlannerController = require('../controllers/tourPlannerController');

// 1. Get Live Inventory from MySQL (query params: destination, slot_key)
router.get('/inventory', tourPlannerController.getInventory);

// 2. Save Itinerary / Confirm Booking to MySQL
router.post('/save-trip', tourPlannerController.saveTrip);

// 3. Retrieve Stored Trip by PNR Code
router.get('/trip/:tripCode', tourPlannerController.getTripByCode);

// 4. Temporary 10-Minute Seat Hold (Scenario 6 Concurrency)
router.post('/hold-seat', tourPlannerController.holdSeat);

// 5. Bangladesh Cascading Location Hierarchy (Country -> Division -> District -> Upazila)
router.get('/locations/divisions', tourPlannerController.getDivisions);
router.get('/locations/districts', tourPlannerController.getDistricts);
router.get('/locations/upazilas', tourPlannerController.getUpazilas);
router.get('/locations/search', tourPlannerController.searchLocations);

// 6. Tour Destination Places (Country -> Division -> District -> Tourist Destinations)
router.get('/destinations/places', tourPlannerController.getTourDestinations);
router.get('/destinations/search', tourPlannerController.searchTourDestinations);

module.exports = router;

