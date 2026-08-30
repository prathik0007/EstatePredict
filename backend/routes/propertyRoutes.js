const express = require('express');
const {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  getMyProperties
} = require('../controllers/propertyController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', getProperties);
router.get('/my-listings', protect, authorize('owner', 'admin'), getMyProperties);
router.get('/:id', getPropertyById);

router.post('/', protect, authorize('owner', 'admin'), upload.array('images', 8), createProperty);
router.put('/:id', protect, authorize('owner', 'admin'), upload.array('images', 8), updateProperty);
router.delete('/:id', protect, authorize('owner', 'admin'), deleteProperty);

module.exports = router;
