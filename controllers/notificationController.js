// controllers/notificationController.js
const mongoose = require("mongoose");
const Notification = require("../models/Notification");

/**
 * GET /api/notifications?skip=0&limit=20
 * Returns newest → oldest notifications for the logged‑in user.
 * Also sends back the current unread count so the client can keep its badge in sync.
 */
exports.getNotifications = async (req, res) => {
  try {
    // graceful fallbacks
    let skip = Number(req.query.skip) || 0;
    let limit = Number(req.query.limit) || 20;
    if (limit > 50) limit = 50; // safety cap

    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ recipient: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("sender", "username name profilePicture")
        .populate("post", "images video")
        .lean(),

      Notification.countDocuments({ recipient: req.user._id, read: false }),
    ]);

    res.json({ notifications, unreadCount });
  } catch (err) {
    console.error("getNotifications error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * PATCH /api/notifications/:id/read
 * Marks a single notification as read.
 */
exports.markRead = async (req, res) => {
  try {
    const { id } = req.params;

    // validate ObjectId early ‑ avoids CastError noise
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid notification id" });

    const updated = await Notification.findOneAndUpdate(
      { _id: id, recipient: req.user._id, read: false },
      { $set: { read: true } },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Not found" });

    // Get updated unread count
    const unreadCount = await Notification.countDocuments({ 
      recipient: req.user._id, 
      read: false 
    });

    res.json({ success: true, unreadCount });
  } catch (err) {
    console.error("markRead error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * PATCH /api/notifications/read-all
 * Marks **every** unread notification as read for the user.
 * Returns the number of docs modified.
 */
exports.markAllRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { $set: { read: true } }
    );

    res.json({ 
      updatedCount: result.modifiedCount,
      unreadCount: 0 // after marking all as read, unread count is 0
    });
  } catch (err) {
    console.error("markAllRead error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/notifications/unread-count
 * Returns just the unread count for the notification badge
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      read: false
    });

    res.json({ unreadCount });
  } catch (err) {
    console.error("getUnreadCount error:", err);
    res.status(500).json({ message: "Server error" });
  }
};