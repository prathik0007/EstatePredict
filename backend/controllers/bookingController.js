const Booking = require('../models/Booking');
const Property = require('../models/Property');
const Notification = require('../models/Notification');

// @desc    Create a site visit booking / inquiry
// @route   POST /api/bookings
// @access  Private (Tenant)
exports.createBooking = async (req, res) => {
  try {
    const { propertyId, visitDate, timeSlot, message, contactNumber } = req.body;

    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Check if tenant is booking their own property
    if (property.owner.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot book a visit for your own property.'
      });
    }

    const booking = await Booking.create({
      property: propertyId,
      tenant: req.user.id,
      owner: property.owner,
      visitDate,
      timeSlot,
      message,
      contactNumber: contactNumber || req.user.phone || 'Not provided'
    });

    // Create notification for the Owner
    await Notification.create({
      recipient: property.owner,
      sender: req.user.id,
      type: 'booking_request',
      title: 'New Visit Booking Request',
      message: `${req.user.name} requested a site visit for "${property.title}" on ${new Date(visitDate).toLocaleDateString()}.`,
      link: '/owner/bookings'
    });

    res.status(201).json({
      success: true,
      message: 'Visit request submitted successfully!',
      booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating booking'
    });
  }
};

// @desc    Get tenant's bookings
// @route   GET /api/bookings/my-bookings
// @access  Private (Tenant)
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ tenant: req.user.id })
      .populate('property')
      .populate('owner', 'name email phone avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching your bookings'
    });
  }
};

// @desc    Get owner's incoming visit requests
// @route   GET /api/bookings/owner-requests
// @access  Private (Owner)
exports.getOwnerRequests = async (req, res) => {
  try {
    const bookings = await Booking.find({ owner: req.user.id })
      .populate('property')
      .populate('tenant', 'name email phone avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching booking requests'
    });
  }
};

// @desc    Update booking status (Accept / Reject)
// @route   PUT /api/bookings/:id/status
// @access  Private (Owner)
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status, ownerNotes } = req.body;
    const booking = await Booking.findById(req.params.id).populate('property');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Verify ownership
    if (booking.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this booking'
      });
    }

    booking.status = status;
    if (ownerNotes) booking.ownerNotes = ownerNotes;
    await booking.save();

    // Create notification for Tenant
    const notifType = status === 'accepted' ? 'booking_accepted' : 'booking_rejected';
    await Notification.create({
      recipient: booking.tenant,
      sender: req.user.id,
      type: notifType,
      title: `Booking Request ${status.toUpperCase()}`,
      message: `Your visit request for "${booking.property.title}" has been ${status} by the owner.`,
      link: '/tenant/bookings'
    });

    res.status(200).json({
      success: true,
      message: `Booking request marked as ${status}`,
      booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating booking status'
    });
  }
};
