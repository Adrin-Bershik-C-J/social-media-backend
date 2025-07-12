const Comment = require("../models/Comment");
const Post = require("../models/Post");
const { pushNotification } = require("../utils/notify");

// Create a new comment or reply
exports.createComment = async (req, res) => {
  const { text, parent = null } = req.body;

  try {
    /* 1. Validate input */
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    if (text.length > 1000) {
      return res
        .status(400)
        .json({ message: "Comment too long (max 1000 characters)" });
    }

    /* 2. Create the new comment */
    const comment = await Comment.create({
      post: req.params.postId,
      user: req.user._id,
      text: text.trim(),
      parent,
    });

    /* 3. Populate comment with user info for response */
    await comment.populate("user", "name username profilePicture");

    /* 4. Respond to client immediately */
    res.status(201).json(comment);

    /* 5. Handle notifications asynchronously */
    setImmediate(async () => {
      try {
        if (parent) {
          /* ─── Reply: notify parent comment's author ─── */
          const parentComment = await Comment.findById(parent)
            .select("user post")
            .lean();

          if (
            parentComment &&
            String(parentComment.user) !== String(req.user._id)
          ) {
            await pushNotification({
              recipient: parentComment.user,
              sender: req.user._id,
              type: "reply_comment",
              post: parentComment.post,
              comment: comment._id,
              parent: parentComment._id,
            });
          }
        } else {
          /* ─── Top‑level comment: notify post author ─── */
          const post = await Post.findById(req.params.postId)
            .select("user")
            .lean();

          if (post && String(post.user) !== String(req.user._id)) {
            await pushNotification({
              recipient: post.user,
              sender: req.user._id,
              type: "comment_post",
              post: post._id,
              comment: comment._id,
            });
          }
        }
      } catch (err) {
        console.error("Failed to send comment notification:", err);
      }
    });
  } catch (err) {
    console.error("createComment error:", err);
    if (!res.headersSent) res.status(500).json({ message: "Server error" });
  }
};

// Get comments for a post (nested)
exports.getPostComments = async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate("user", "username name profilePicture")
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
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const userId = req.user._id;
    const liked = !comment.likes.includes(userId);

    liked ? comment.likes.push(userId) : comment.likes.pull(userId);
    await comment.save();

    /* Send response with like count */
    res.json({
      message: liked ? "Comment liked" : "Like removed",
      likeCount: comment.likes.length,
      isLiked: liked,
    });

    /* Send notification only when liking (not unliking) and not own comment */
    if (liked && String(comment.user) !== String(userId)) {
      setImmediate(async () => {
        try {
          await pushNotification({
            recipient: comment.user,
            sender: userId,
            type: "like_comment",
            comment: comment._id,
            post: comment.post,
          });
        } catch (err) {
          console.error("Failed to send comment like notification:", err);
        }
      });
    }
  } catch (err) {
    console.error("toggleLikeComment error:", err);
    if (!res.headersSent) res.status(500).json({ message: "Server error" });
  }
};

// // Edit a comment
// exports.editComment = async (req, res) => {
//   const { text } = req.body;
//   try {
//     const comment = await Comment.findById(req.params.commentId);

//     if (!comment || comment.user.toString() !== req.user._id.toString()) {
//       return res.status(403).json({ message: "Not authorized" });
//     }

//     comment.text = text;
//     await comment.save();
//     res.json({ message: "Comment updated", comment });
//   } catch (err) {
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // Delete a comment
// exports.deleteComment = async (req, res) => {
//   try {
//     const comment = await Comment.findById(req.params.commentId);

//     if (!comment || comment.user.toString() !== req.user._id.toString()) {
//       return res.status(403).json({ message: "Not authorized" });
//     }

//     await comment.deleteOne();
//     res.json({ message: "Comment deleted" });
//   } catch (err) {
//     res.status(500).json({ message: "Server error" });
//   }
// };

// Update a comment
exports.updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { text } = req.body;

    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    comment.text = text;
    await comment.save();

    res.json({ message: "Comment updated successfully", comment });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a comment
exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await comment.deleteOne();

    res.json({ message: "Comment deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
