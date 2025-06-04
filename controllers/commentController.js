const Comment = require("../models/Comment");

// Create a new comment or reply
exports.createComment = async (req, res) => {
  const { text, parent } = req.body;
  try {
    const comment = await Comment.create({
      post: req.params.postId,
      user: req.user._id,
      text,
      parent: parent || null,
    });
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get comments for a post (nested)
exports.getPostComments = async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate("user", "username name")
      .populate("parent")
      .sort({ createdAt: 1 });

    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Like/unlike a comment
exports.toggleLikeComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    const userId = req.user._id;

    if (!comment.likes.includes(userId)) {
      comment.likes.push(userId);
      await comment.save();
      return res.json({ message: "Comment liked" });
    } else {
      comment.likes.pull(userId);
      await comment.save();
      return res.json({ message: "Like removed" });
    }
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Edit a comment
exports.editComment = async (req, res) => {
  const { text } = req.body;
  try {
    const comment = await Comment.findById(req.params.commentId);

    if (!comment || comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    comment.text = text;
    await comment.save();
    res.json({ message: "Comment updated", comment });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a comment
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);

    if (!comment || comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await comment.deleteOne();
    res.json({ message: "Comment deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
