const express = require("express");
const router = express.Router();
const {
  createPost,
  getAllPosts,
  likePost,
  commentPost,
  deletePost,
  getFeedPosts,
  editPost
} = require("../controllers/postController");
const protect = require("../middlewares/authMiddleware");

router.post("/", protect, createPost);
router.get("/", protect, getAllPosts);
router.post("/:id/like", protect, likePost);
// router.post("/:id/comment", protect, commentPost);
router.delete("/:id", protect, deletePost);
router.get("/feed", protect, getFeedPosts);
router.put("/edit/:id", protect, editPost);


module.exports = router;
