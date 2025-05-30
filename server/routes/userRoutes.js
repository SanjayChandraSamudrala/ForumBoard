const express = require('express');
const router = express.Router();
const { getUserContent, getLikedContent } = require('../controllers/userController');
const auth = require('../middleware/authMiddleware');

// Get user's content (threads and responses)
router.get('/:userId/content', auth, getUserContent);

// Get user's liked content
router.get('/:userId/liked-content', auth, getLikedContent);

module.exports = router; 