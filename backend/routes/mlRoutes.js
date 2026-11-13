const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { predictRent, checkMlHealth } = require('../controllers/mlController');

const router = express.Router();

// Dedicated local temporary storage for ML estimation uploads (avoids remote Cloudinary latency and keeps local files accessible)
const tempDir = path.resolve(__dirname, '../uploads/temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const mlStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, tempDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `ml-eval-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

const mlUpload = multer({
  storage: mlStorage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|jfif|avif/i;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext || mime) return cb(null, true);
    cb(new Error('Only valid image files are allowed'), false);
  }
});

router.all('/health', checkMlHealth);
router.post('/predict-rent', mlUpload.single('image'), predictRent);

module.exports = router;
