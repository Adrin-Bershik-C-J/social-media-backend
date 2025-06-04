const express = require("express");
const router = express.Router();
const {
  createPost,
  getAllPosts,
  likePost,
  commentPost,
  deletePost,
  getFeedPosts,
} = require("../controllers/postController");
const protect = require("../middlewares/authMiddleware");

router.post("/", protect, createPost);
router.get("/", protect, getAllPosts);
router.post("/:id/like", protect, likePost);
// router.post("/:id/comment", protect, commentPost);
router.delete("/:id", protect, deletePost);
router.get("/feed", protect, getFeedPosts);

module.exports = router;
