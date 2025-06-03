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

exports.followUser = async (req, res) => {
  const targetUserId = req.params.id;
  const currentUserId = req.user._id;

  if (currentUserId.toString() === targetUserId)
    return res.status(400).json({ message: "You can't follow yourself" });

  try {
    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser.followers.includes(currentUserId)) {
      targetUser.followers.push(currentUserId);
      currentUser.following.push(targetUserId);

      await targetUser.save();
      await currentUser.save();
      res.json({ message: "User followed" });
    } else {
      res.status(400).json({ message: "Already following" });
    }
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.unfollowUser = async (req, res) => {
  const targetUserId = req.params.id;
  const currentUserId = req.user._id;

  try {
    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (targetUser.followers.includes(currentUserId)) {
      targetUser.followers.pull(currentUserId);
      currentUser.following.pull(targetUserId);

      await targetUser.save();
      await currentUser.save();
      res.json({ message: "User unfollowed" });
    } else {
      res.status(400).json({ message: "Not following this user" });
    }
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
