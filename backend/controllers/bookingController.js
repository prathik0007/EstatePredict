const Booking = require('../models/Booking');
const Property = require('../models/Property');
const Notification = require('../models/Notification');
const User = require('../models/User');
const emailService = require('../utils/emailService');

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
      link: '/owner/dashboard'
    });

    // Dispatch email notification to property owner asynchronously (non-blocking)
    try {
      const ownerUser = await User.findById(property.owner).select('name email');
      if (ownerUser && ownerUser.email) {
        emailService.sendNewBookingEmail({
          ownerEmail: ownerUser.email,
          ownerName: ownerUser.name,
          tenantName: req.user.name,
          tenantEmail: req.user.email,
          tenantPhone: contactNumber || req.user.phone,
          propertyTitle: property.title,
          visitDate,
          timeSlot,
          message,
          bookingId: booking._id
        }).catch(err => {
          console.error('[BookingController] Owner notification email delivery error:', err.message);
        });
      }
    } catch (emailErr) {
      console.error('[BookingController] Owner lookup for email failed:', emailErr.message);
    }

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
    const booking = await Booking.findById(req.params.id)
      .populate('property')
      .populate('tenant', 'name email phone')
      .populate('owner', 'name email phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Verify ownership
    const ownerId = booking.owner._id ? booking.owner._id.toString() : booking.owner.toString();
    if (ownerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this booking'
      });
    }

    const previousStatus = booking.status;
    const isStatusChanged = previousStatus !== status;

    booking.status = status;
    if (ownerNotes !== undefined) booking.ownerNotes = ownerNotes;
    await booking.save();

    // Prevent duplicate emails and notifications when updated repeatedly to identical status
    if (isStatusChanged) {
      // Create in-app notification for Tenant
      const notifType = status === 'accepted' ? 'booking_accepted' : 'booking_rejected';
      await Notification.create({
        recipient: booking.tenant._id || booking.tenant,
        sender: req.user.id,
        type: notifType,
        title: `Booking Request ${status.toUpperCase()}`,
        message: `Your visit request for "${booking.property?.title}" has been ${status} by the owner.`,
        link: '/tenant/dashboard'
      });

      // Send email notification to tenant (graceful, non-blocking failure)
      if (booking.tenant && booking.tenant.email) {
        emailService.sendBookingStatusEmail({
          tenantEmail: booking.tenant.email,
          tenantName: booking.tenant.name,
          propertyTitle: booking.property?.title,
          visitDate: booking.visitDate,
          timeSlot: booking.timeSlot,
          status,
          ownerNotes: booking.ownerNotes,
          bookingId: booking._id
        }).catch(emailErr => {
          console.error('[BookingController] Tenant status email delivery error:', emailErr.message);
        });
      }
    }

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
