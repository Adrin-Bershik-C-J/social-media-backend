const User = require("../models/User");

exports.getProfile = async (req, res) => {
  const user = req.user;
  res.json(user);
};

exports.updateProfile = async (req, res) => {
  const { name, bio } = req.body;
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, bio },
      { new: true }
    ).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.toggleFollow = async (req, res) => {
  const targetUserId = req.params.id;
  const currentUserId = req.user._id;

  // Prevent self-following
  if (currentUserId.toString() === targetUserId) {
    return res.status(400).json({ message: "You can't follow yourself" });
  }

  try {
    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    // Check if target user exists
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const isFollowing = currentUser.following.includes(targetUserId);

    if (isFollowing) {
      // Unfollow: Remove from both arrays
      currentUser.following.pull(targetUserId);
      targetUser.followers.pull(currentUserId);

      await Promise.all([currentUser.save(), targetUser.save()]);

      res.json({
        message: "User unfollowed",
        isFollowing: false,
        followersCount: targetUser.followers.length,
        followingCount: currentUser.following.length,
      });
    } else {
      // Follow: Add to both arrays
      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);

      await Promise.all([currentUser.save(), targetUser.save()]);

      res.json({
        message: "User followed",
        isFollowing: true,
        followersCount: targetUser.followers.length,
        followingCount: currentUser.following.length,
      });
    }
  } catch (err) {
    console.error("Toggle follow error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
