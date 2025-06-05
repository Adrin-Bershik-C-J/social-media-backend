const express = require("express");
const router = express.Router();
const {
  getProfile,
  updateProfile,
  // followUser,
  // unfollowUser,
  toggleFollow
} = require("../controllers/userController");
const protect = require("../middlewares/authMiddleware");

router.get("/me", protect, getProfile);
router.put("/update", protect, updateProfile);
router.post("/follow/:id", protect, toggleFollow);

module.exports = router;
