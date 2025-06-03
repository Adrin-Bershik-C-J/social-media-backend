const express = require("express");
const router = express.Router();
const {
  getProfile,
  updateProfile,
  followUser,
  unfollowUser,
} = require("../controllers/userController");
const protect = require("../middlewares/authMiddleware");

router.get("/me", protect, getProfile);
router.put("/update", protect, updateProfile);
router.post("/follow/:id", protect, followUser);
router.post("/unfollow/:id", protect, unfollowUser);

module.exports = router;
