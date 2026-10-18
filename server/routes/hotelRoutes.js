const express = require('express');
const router = express.Router();
const hotelController = require('../controllers/hotelController');
const { verifyToken, requireManagerOrAdmin } = require('../middleware/authMiddleware');

router.get('/', hotelController.getAllHotels);
router.get('/:id', hotelController.getHotelById);
router.post('/', verifyToken, requireManagerOrAdmin, hotelController.createHotel);
router.put('/:id', verifyToken, requireManagerOrAdmin, hotelController.updateHotel);
router.put('/:id/status', verifyToken, requireManagerOrAdmin, hotelController.toggleHotelStatus);
router.delete('/:id', verifyToken, requireManagerOrAdmin, hotelController.deleteHotel);
router.post('/rooms', verifyToken, requireManagerOrAdmin, hotelController.addHotelRoom);

module.exports = router;
