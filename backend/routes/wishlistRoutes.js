const express = require('express');
const { getWishlist, toggleWishlist } = require('../controllers/wishlistController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, authorize('tenant'), getWishlist);
router.post('/toggle', protect, authorize('tenant'), toggleWishlist);

module.exports = router;
