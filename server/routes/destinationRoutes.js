const express = require('express');
const router = express.Router();
const destController = require('../controllers/destinationController');
const { verifyToken, requireManagerOrAdmin, requireSuperAdmin } = require('../middleware/authMiddleware');

// 1. Meta / Lookup Routes for Dynamic Add Forms (Must come before /:id)
router.get('/meta/countries', destController.getCountries);
router.post('/meta/countries', verifyToken, requireManagerOrAdmin, destController.createCountry);

router.get('/meta/divisions', destController.getDivisions);
router.post('/meta/divisions', verifyToken, requireManagerOrAdmin, destController.createDivision);

router.get('/meta/cities', destController.getCities);
router.post('/meta/cities', verifyToken, requireManagerOrAdmin, destController.createCity);

router.get('/meta/categories', destController.getCategories);
router.post('/meta/categories', verifyToken, requireManagerOrAdmin, destController.createCategory);

router.get('/meta/durations', destController.getDurations);
router.post('/meta/durations', verifyToken, requireManagerOrAdmin, destController.createDuration);

router.post('/validate', destController.validateDestination);
router.post('/draft', verifyToken, requireManagerOrAdmin, destController.saveDestinationDraft);

// 2. Reviews
router.post('/review', verifyToken, destController.addReview);

// 3. Base Destination CRUD
router.get('/', destController.getAllDestinations);
router.post('/', verifyToken, requireManagerOrAdmin, destController.createDestination);

// 4. Specific Destination & Relational Master Entities
router.get('/:id', destController.getDestinationById);
router.put('/:id', verifyToken, requireManagerOrAdmin, destController.updateDestination);
router.put('/:id/status', verifyToken, requireManagerOrAdmin, destController.toggleDestinationStatus);
router.delete('/:id', verifyToken, requireSuperAdmin, destController.deleteDestination);

// 5. Relational Master Inventory CRUD for Destination
router.get('/:id/inventory', destController.getDestinationInventory);
router.post('/:id/inventory/:type', verifyToken, requireManagerOrAdmin, destController.createInventoryItem);
router.delete('/:id/inventory/:type/:itemId', verifyToken, requireManagerOrAdmin, destController.deleteInventoryItem);
router.post('/:id/inventory-link', verifyToken, requireManagerOrAdmin, destController.linkExistingInventory);

module.exports = router;
