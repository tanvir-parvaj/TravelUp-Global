const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const { verifyToken, requireContentStaff } = require('../middleware/authMiddleware');

router.get('/', blogController.getAllBlogs);
router.get('/:id', blogController.getBlogById);
router.post('/', verifyToken, requireContentStaff, blogController.createBlog);

module.exports = router;
