// backend/src/middleware/multerConfig.js
// Multer configuration for handling property image uploads.
// Saves files to ./uploads/properties with unique filenames.
// Allows JPEG, PNG, WebP, GIF. Max size 5 MB per file, max 10 files per request.

const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads/properties');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Generate a unique filename to avoid collisions
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
    cb(null, unique);
  },
});

// File filter to accept only supported image types
const fileFilter = (req, file, cb) => {
  const allowed = /\.(jpg|jpeg|png|gif|webp)$/i;
  if (allowed.test(file.originalname)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Allowed: JPEG, PNG, GIF, WebP'));
  }
};

const limits = {
  fileSize: 5 * 1024 * 1024, // 5 MB per file
  files: 10, // max 10 files per request
};

const upload = multer({ storage, fileFilter, limits });

module.exports = { upload, uploadDir };

