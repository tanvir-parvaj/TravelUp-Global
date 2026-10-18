const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, wishlistController.getUserWishlist);
router.post('/', verifyToken, wishlistController.addToWishlist);
router.delete('/:id', verifyToken, wishlistController.removeFromWishlist);
router.delete('/destination/:destId', verifyToken, wishlistController.removeByDestination);

module.exports = router;
