const Wishlist = require('../models/Wishlist');

// @desc    Get user's wishlist
// @route   GET /api/wishlist
// @access  Private (Tenant)
exports.getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user.id })
      .populate({
        path: 'properties',
        populate: { path: 'owner', select: 'name email phone avatar' }
      });

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user.id, properties: [] });
    }

    res.status(200).json({
      success: true,
      wishlist: wishlist.properties
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching wishlist'
    });
  }
};

// @desc    Toggle item in wishlist (Add/Remove)
// @route   POST /api/wishlist/toggle
// @access  Private (Tenant)
exports.toggleWishlist = async (req, res) => {
  try {
    const { propertyId } = req.body;
    let wishlist = await Wishlist.findOne({ user: req.user.id });

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user.id, properties: [propertyId] });
      return res.status(200).json({
        success: true,
        isWishlisted: true,
        message: 'Added to favorites'
      });
    }

    const index = wishlist.properties.indexOf(propertyId);
    let isWishlisted = false;

    if (index === -1) {
      wishlist.properties.push(propertyId);
      isWishlisted = true;
    } else {
      wishlist.properties.splice(index, 1);
      isWishlisted = false;
    }

    await wishlist.save();

    res.status(200).json({
      success: true,
      isWishlisted,
      message: isWishlisted ? 'Added to favorites' : 'Removed from favorites'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling wishlist'
    });
  }
};
