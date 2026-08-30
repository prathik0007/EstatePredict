const express = require('express');
const {
  createBooking,
  getMyBookings,
  getOwnerRequests,
  updateBookingStatus
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, authorize('tenant'), createBooking);
router.get('/my-bookings', protect, authorize('tenant'), getMyBookings);
router.get('/owner-requests', protect, authorize('owner', 'admin'), getOwnerRequests);
router.put('/:id/status', protect, authorize('owner', 'admin'), updateBookingStatus);

module.exports = router;
