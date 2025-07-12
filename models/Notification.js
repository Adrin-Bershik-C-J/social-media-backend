const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    // who should see this notification
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // who triggered it (optional for system events)
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // what happened
    type: {
      type: String,
      enum: [
        "new_post",
        "like_post",
        "comment_post",
        "follow",
        "like_comment",
        "reply_comment",
      ],
      required: true,
    },

    // optional context
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
    comment: { type: mongoose.Schema.Types.ObjectId, ref: "Comment" },

    // UI helpers
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
