const express = require('express');
const { predictRent, checkMlHealth } = require('../controllers/mlController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/health', checkMlHealth);
router.post('/predict-rent', protect, upload.single('image'), predictRent);

module.exports = router;
