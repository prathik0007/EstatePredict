const express = require('express');
const { addReview, getPropertyReviews } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/property/:propertyId', getPropertyReviews);
router.post('/', protect, addReview);

module.exports = router;
