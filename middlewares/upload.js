const multer = require("multer");
// const path = require("path");

const storage = multer.memoryStorage(); // We'll upload from buffer to Cloudinary

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "video/mp4",
  ];
  cb(null, allowedMimeTypes.includes(file.mimetype));
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB max (adjust if needed)
  },
});

module.exports = upload;
