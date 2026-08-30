const User = require('../models/User');
const Property = require('../models/Property');
const Booking = require('../models/Booking');
const Review = require('../models/Review');

// @desc    Get Admin platform statistics & analytics
// @route   GET /api/admin/stats
// @access  Private (Admin)
exports.getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalOwners = await User.countDocuments({ role: 'owner' });
    const totalTenants = await User.countDocuments({ role: 'tenant' });
    const totalProperties = await Property.countDocuments();
    const availableProperties = await Property.countDocuments({ status: 'available' });
    const pendingProperties = await Property.countDocuments({ status: 'pending_approval' });
    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const acceptedBookings = await Booking.countDocuments({ status: 'accepted' });
    const totalReviews = await Review.countDocuments();

    // City-wise distribution
    const cityStats = await Property.aggregate([
      { $group: { _id: '$location.city', count: { $sum: 1 }, avgPrice: { $avg: '$price' } } },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        users: { total: totalUsers, owners: totalOwners, tenants: totalTenants },
        properties: { total: totalProperties, available: availableProperties, pending: pendingProperties },
        bookings: { total: totalBookings, pending: pendingBookings, accepted: acceptedBookings },
        reviews: totalReviews,
        cityStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching platform statistics'
    });
  }
};

// @desc    Get all users (Admin)
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
};

// @desc    Moderate property listing (Approve / Reject)
// @route   PUT /api/admin/properties/:id/status
// @access  Private (Admin)
exports.moderateProperty = async (req, res) => {
  try {
    const { status } = req.body;
    const property = await Property.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `Property listing status set to ${status}`,
      property
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating property status'
    });
  }
};
