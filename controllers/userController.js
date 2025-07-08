const User = require("../models/User");
const cloudinary = require("cloudinary").v2;

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

exports.getFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "following",
      "name username profilePicture"
    );
    res.json(user.following);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch following users" });
  }
};

exports.getFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "followers",
      "name username profilePicture"
    );
    res.json(user.followers);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch followers" });
  }
};

exports.uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded." });
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "profile_pictures",
        resource_type: "image",
      },
      async (error, result) => {
        if (error) {
          console.error("Cloudinary error:", error);
          return res.status(500).json({ message: "Upload failed." });
        }

        const updatedUser = await User.findByIdAndUpdate(
          req.user._id,
          { profilePicture: result.secure_url },
          { new: true }
        ).select("-password"); // exclude password

        res.status(200).json(updatedUser);
      }
    );

    stream.end(req.file.buffer);
  } catch (err) {
    console.error("Profile picture upload error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getHomeFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password") // omit sensitive info
      .populate("following", "_id") // only get _id from followed users
      .populate("followers", "_id");

    res.json(user);
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getUserDetails = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username })
      .select("name username bio profilePicture followers following") // exclude password
      .populate("followers", "username profilePicture")
      .populate("following", "username profilePicture");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error("Error in getUserDetails:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
