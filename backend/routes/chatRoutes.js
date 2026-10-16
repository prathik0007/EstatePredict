const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getOrCreateConversation,
  getUserConversations,
  getConversationById,
  getConversationMessages,
  sendMessage
} = require('../controllers/chatController');

// All chat and conversation routes require authentication
router.use(protect);

router.route('/')
  .post(getOrCreateConversation)
  .get(getUserConversations);

router.route('/:id')
  .get(getConversationById);

router.route('/:id/messages')
  .get(getConversationMessages)
  .post(sendMessage);

module.exports = router;
