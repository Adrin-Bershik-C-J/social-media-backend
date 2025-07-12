// routes/notificationRoutes.js
const router = require("express").Router();
const protect = require("../middlewares/authMiddleware");
const {
  getNotifications,
  markRead,
  markAllRead,
} = require("../controllers/notificationController");

router.use(protect);
router.get("/", getNotifications);
router.patch("/:id/read", markRead);
router.patch("/read-all", markAllRead);

module.exports = router;
