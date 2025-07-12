// utils/notificationUtils.js
const mongoose = require("mongoose");
const Notification = require("../models/Notification");
const { io } = require("./socket");

/**
 * Creates a notification and sends it via socket
 * @param {Object} doc - notification document data
 * @returns {Promise<Object>} - created notification document
 */
exports.pushNotification = async (doc) => {
  try {
    const notif = await Notification.create({
      ...doc,
      read: doc.read ?? false,
    });

    // Populate sender info for real-time notification
    const populatedNotif = await Notification.findById(notif._id)
      .populate("sender", "username name profilePicture")
      .populate("post", "images video")
      .lean();

    // Send real-time notification with all necessary data
    io().to(String(notif.recipient)).emit("notification:new", populatedNotif);
    
    return populatedNotif;
  } catch (error) {
    console.error("pushNotification error:", error);
    throw error;
  }
};

/**
 * Bulk create notifications for multiple recipients
 * @param {Array<Object>} notifications - array of notification documents
 * @returns {Promise<Array>} - created notification documents
 */
exports.pushBulkNotifications = async (notifications) => {
  try {
    const createdNotifications = await Notification.insertMany(
      notifications.map(notif => ({
        ...notif,
        read: notif.read ?? false,
      }))
    );

    // Populate and send real-time notifications
    const populatedNotifs = await Notification.find({
      _id: { $in: createdNotifications.map(n => n._id) }
    })
      .populate("sender", "username name profilePicture")
      .populate("post", "images video")
      .lean();

    // Send real-time notifications to each recipient
    populatedNotifs.forEach(notif => {
      io().to(String(notif.recipient)).emit("notification:new", notif);
    });

    return populatedNotifs;
  } catch (error) {
    console.error("pushBulkNotifications error:", error);
    throw error;
  }
};

/**
 * Get unread count for a specific user
 * @param {string|ObjectId} userId - user ID
 * @returns {Promise<number>} - unread count
 */
exports.getUnreadCount = async (userId) => {
  try {
    const count = await Notification.countDocuments({
      recipient: userId,
      read: false
    });
    return count;
  } catch (error) {
    console.error("getUnreadCount error:", error);
    return 0;
  }
};