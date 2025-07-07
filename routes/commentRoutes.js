const express = require("express");
const router = express.Router();
const {
  createComment,
  getPostComments,
  toggleLikeComment,
  updateComment,
  deleteComment,
} = require("../controllers/commentController");
const protect = require("../middlewares/authMiddleware");

// Create comment or reply
router.post("/:postId", protect, createComment);

// Get all comments for a post
router.get("/:postId", protect, getPostComments);

// Like/unlike comment
router.post("/like/:commentId", protect, toggleLikeComment);

// // Edit comment
// router.put("/:commentId", protect, editComment);

// // Delete comment
// router.delete("/:commentId", protect, deleteComment);

router.put("/:commentId", protect, updateComment);
router.delete("/:commentId", protect, deleteComment);


module.exports = router;
