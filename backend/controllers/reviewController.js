const Review = require('../models/Review');
const Property = require('../models/Property');

// @desc    Add review for a property
// @route   POST /api/reviews
// @access  Private (Tenant/Owner)
exports.addReview = async (req, res) => {
  try {
    const { propertyId, rating, comment } = req.body;

    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Check if user already reviewed
    const existingReview = await Review.findOne({ property: propertyId, user: req.user.id });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this property.'
      });
    }

    const review = await Review.create({
      property: propertyId,
      user: req.user.id,
      rating,
      comment
    });

    const populatedReview = await Review.findById(review._id).populate('user', 'name avatar');

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      review: populatedReview
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating review'
    });
  }
};

// @desc    Get reviews for a property
// @route   GET /api/reviews/property/:propertyId
// @access  Public
exports.getPropertyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ property: req.params.propertyId })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });

    const avgRating = reviews.length > 0
      ? (reviews.reduce((acc, item) => acc + item.rating, 0) / reviews.length).toFixed(1)
      : 0;

    res.status(200).json({
      success: true,
      count: reviews.length,
      avgRating: Number(avgRating),
      reviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews'
    });
  }
};
