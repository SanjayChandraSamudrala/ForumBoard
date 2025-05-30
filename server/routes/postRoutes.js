const express = require('express');
const router = express.Router();
const {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  addReply,
  toggleLike,
  toggleDislike,
  toggleReplyLike,
  toggleReplyDislike
} = require('../controllers/postController');
const auth = require('../middleware/authMiddleware');

// Get all posts and create post
router.route('/')
  .get(getPosts)
  .post(auth, createPost);

// Get, update and delete specific post
router.route('/:id')
  .get(getPost)
  .put(auth, updatePost)
  .delete(auth, deletePost);

// Post interactions
router.post('/:id/replies', auth, addReply);
router.post('/:id/like', auth, toggleLike);
router.post('/:id/dislike', auth, toggleDislike);

// Reply interactions
router.post('/:postId/replies/:replyId/like', auth, toggleReplyLike);
router.post('/:postId/replies/:replyId/dislike', auth, toggleReplyDislike);

module.exports = router; 