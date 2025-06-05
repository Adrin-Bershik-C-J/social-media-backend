const Post = require("../models/Post");

exports.createPost = async (req, res) => {
  const { caption } = req.body;
  try {
    const post = await Post.create({ user: req.user._id, caption });
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

//Posts of logged in user
exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find({ user: req.user._id })
      .populate("user", "username name")
      .populate("comments.user", "username name")
      .sort({ createdAt: -1 });

    const enrichedPosts = posts.map((post) => ({
      ...post.toObject(),
      likeCount: post.likes.length,
      isLiked: post.likes.includes(req.user._id),
    }));

    res.json(enrichedPosts);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const userId = req.user._id;

    let liked;
    if (!post.likes.includes(userId)) {
      post.likes.push(userId);
      liked = true;
    } else {
      post.likes.pull(userId);
      liked = false;
    }

    await post.save();

    res.json({
      message: liked ? "Post liked" : "Like removed",
      likeCount: post.likes.length,
      isLiked: liked,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// exports.commentPost = async (req, res) => {
//   const { text } = req.body;
//   try {
//     const post = await Post.findById(req.params.id);
//     post.comments.push({ user: req.user._id, text });
//     await post.save();
//     res.json({ message: "Comment added" });
//   } catch (err) {
//     res.status(500).json({ message: "Server error" });
//   }
// };

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (post.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this post" });
    }

    await post.deleteOne();
    res.json({ message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getFeedPosts = async (req, res) => {
  try {
    const currentUser = req.user;
    const followingIds = currentUser.following || [];

    // If no following users, fetch all posts; else fetch posts from following
    const filter =
      followingIds.length > 0 ? { user: { $in: followingIds } } : {};

    const posts = await Post.find(filter)
      .populate("user", "username name")
      .populate("comments.user", "username name")
      .sort({ createdAt: -1 });

    // Remove posts where user is null (shouldn't happen normally)
    const filteredPosts = posts.filter((post) => post.user);

    const enrichedPosts = filteredPosts.map((post) => ({
      ...post.toObject(),
      likeCount: post.likes.length,
      isLiked: post.likes.includes(currentUser._id),
    }));

    res.json(enrichedPosts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// controllers/postController.js
exports.editPost = async (req, res) => {
  const { caption } = req.body;
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to edit this post" });
    }

    post.caption = caption;
    await post.save();

    res.json(post);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
