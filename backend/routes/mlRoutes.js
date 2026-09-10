const express = require('express');
const { predictRent, checkMlHealth } = require('../controllers/mlController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.all('/health', checkMlHealth);
router.post('/predict-rent', upload.single('image'), predictRent);

module.exports = router;
