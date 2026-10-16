const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastMessage: {
    type: String,
    default: ''
  },
  lastMessageSender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index to prevent duplicate conversations between the same tenant and owner for a property
conversationSchema.index({ property: 1, tenant: 1, owner: 1 }, { unique: true });
conversationSchema.index({ tenant: 1, lastMessageAt: -1 });
conversationSchema.index({ owner: 1, lastMessageAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
