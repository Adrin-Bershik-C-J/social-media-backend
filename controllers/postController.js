const Post = require("../models/Post");
const cloudinary = require("../config/cloudinary");

exports.createPost = async (req, res) => {
  try {
    console.log("Request body:", req.body);
    console.log("Files received:", req.files?.length || 0);
    console.log("User:", req.user._id);

    const { caption } = req.body;
    const files = req.files || [];
    let imageUrls = [];
    let videoUrl = "";

    // Process file uploads
    if (files.length > 0) {
      const uploadPromises = files.map(async (file) => {
        const isVideo = file.mimetype.startsWith("video/");

        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              resource_type: isVideo ? "video" : "image",
              folder: "posts",
            },
            (error, result) => {
              if (error) {
                console.error("Cloudinary upload error:", error);
                return reject(error);
              }
              resolve({
                url: result.secure_url,
                type: isVideo ? "video" : "image",
              });
            }
          );
          stream.end(file.buffer);
        });
      });

      const uploads = await Promise.all(uploadPromises);

      uploads.forEach(({ url, type }) => {
        if (type === "image") imageUrls.push(url);
        else if (type === "video") videoUrl = url;
      });

      // Validation
      if (imageUrls.length > 5) {
        return res.status(400).json({ message: "Max 5 images allowed." });
      }

      const videoCount = uploads.filter((u) => u.type === "video").length;
      if (videoCount > 1) {
        return res.status(400).json({ message: "Only one video allowed." });
      }
    }

    const post = await Post.create({
      user: req.user._id,
      caption,
      images: imageUrls,
      video: videoUrl,
    });

    // Populate user info for response
    await post.populate("user", "name username");
    res.status(201).json(post);
  } catch (err) {
    console.error("Detailed error:", err);

    // Only send response if not already sent
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error:
          process.env.NODE_ENV === "development"
            ? err.message
            : "Internal server error",
      });
    }
  }
};

exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find({ user: req.user._id })
      .populate("user", "username name profilePicture")
      .populate("comments.user", "username name profilePicture")
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

    // Pagination params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Fetch all posts not created by the current user
    const filter = { user: { $ne: currentUser._id } };

    // Count total posts for pagination
    const totalPosts = await Post.countDocuments(filter);
    const totalPages = Math.ceil(totalPosts / limit);
    const hasMore = page < totalPages;

    const posts = await Post.find(filter)
      .populate("user", "username name profilePicture")
      .populate("comments.user", "username name profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Remove edge case where user info is null
    const filteredPosts = posts.filter((post) => post.user);

    // Add likeCount and isLiked info
    const enrichedPosts = filteredPosts.map((post) => ({
      ...post.toObject(),
      likeCount: post.likes.length,
      isLiked: post.likes.includes(currentUser._id),
    }));

    res.json({
      posts: enrichedPosts,
      currentPage: page,
      totalPages,
      totalPosts,
      hasMore,
      postsPerPage: limit,
    });
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
