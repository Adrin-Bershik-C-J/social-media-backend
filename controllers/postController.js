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

exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("user", "username name")
      .populate("comments.user", "username name")
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const userId = req.user._id;

    if (!post.likes.includes(userId)) {
      post.likes.push(userId);
      await post.save();
      res.json({ message: "Post liked" });
    } else {
      post.likes.pull(userId);
      await post.save();
      res.json({ message: "Like removed" });
    }
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.commentPost = async (req, res) => {
  const { text } = req.body;
  try {
    const post = await Post.findById(req.params.id);
    post.comments.push({ user: req.user._id, text });
    await post.save();
    res.json({ message: "Comment added" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

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
    const followingIds = currentUser.following;

    const posts = await Post.find({ user: { $in: followingIds } })
      .populate("user", "username name")
      .populate("comments.user", "username name")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
