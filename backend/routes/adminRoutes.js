const express = require('express');
const { getAdminStats, getAllUsers, moderateProperty } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getAdminStats);
router.get('/users', getAllUsers);
router.put('/properties/:id/status', moderateProperty);

module.exports = router;
