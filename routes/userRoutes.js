const express = require("express");
const router = express.Router();
const {
  getProfile,
  updateProfile,
  toggleFollow,
  getFollowers,
  getFollowing,
} = require("../controllers/userController");
const protect = require("../middlewares/authMiddleware");

router.get("/me", protect, getProfile);
router.put("/update", protect, updateProfile);
router.post("/follow/:id", protect, toggleFollow);
router.get("/followers", protect, getFollowers);
router.get("/following", protect, getFollowing);

module.exports = router;
