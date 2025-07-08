const express = require("express");
const router = express.Router();
const {
  createPost,
  getAllPosts,
  likePost,
  getUserPostsByUsername,
  deletePost,
  getFeedPosts,
  editPost,
} = require("../controllers/postController");
const protect = require("../middlewares/authMiddleware");
const upload = require("../middlewares/upload");

router.post("/", protect, upload.array("files", 6), createPost);
router.get("/", protect, getAllPosts);
router.post("/:id/like", protect, likePost);
router.delete("/:id", protect, deletePost);
router.get("/feed", protect, getFeedPosts);
router.put("/edit/:id", protect, editPost);
router.get("/user/:username", protect, getUserPostsByUsername);

module.exports = router;
