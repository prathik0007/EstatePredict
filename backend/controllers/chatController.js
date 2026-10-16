const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Property = require('../models/Property');
const Notification = require('../models/Notification');

// @desc    Initiate or get existing conversation for a property
// @route   POST /api/conversations
// @access  Private (Authenticated users)
exports.getOrCreateConversation = async (req, res) => {
  try {
    const { propertyId, initialMessage } = req.body;

    if (!propertyId) {
      return res.status(400).json({
        success: false,
        message: 'Property ID is required'
      });
    }

    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Prevent property owner from starting a chat with themselves
    if (property.owner.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot initiate a conversation on your own property.'
      });
    }

    const tenantId = req.user.id;
    const ownerId = property.owner;

    // Look for existing conversation
    let conversation = await Conversation.findOne({
      property: propertyId,
      tenant: tenantId,
      owner: ownerId
    });

    let isNew = false;
    if (!conversation) {
      conversation = await Conversation.create({
        property: propertyId,
        tenant: tenantId,
        owner: ownerId,
        lastMessage: initialMessage ? initialMessage.trim().substring(0, 100) : '',
        lastMessageSender: initialMessage ? tenantId : undefined,
        lastMessageAt: Date.now()
      });
      isNew = true;
    }

    // If an initial message was provided, create the message record
    if (initialMessage && initialMessage.trim()) {
      const sanitizedText = initialMessage.trim().substring(0, 2000);
      const newMessage = await Message.create({
        conversation: conversation._id,
        sender: tenantId,
        recipient: ownerId,
        text: sanitizedText
      });

      conversation.lastMessage = sanitizedText;
      conversation.lastMessageSender = tenantId;
      conversation.lastMessageAt = Date.now();
      await conversation.save();

      // Trigger notification to owner
      await Notification.create({
        recipient: ownerId,
        sender: tenantId,
        type: 'general',
        title: `New message from ${req.user.name}`,
        message: sanitizedText.length > 75 ? sanitizedText.substring(0, 72) + '...' : sanitizedText,
        link: `/messages?conversationId=${conversation._id}`
      });
    }

    const populated = await Conversation.findById(conversation._id)
      .populate('property', 'title price images location propertyType')
      .populate('tenant', 'name email avatar role')
      .populate('owner', 'name email avatar role');

    res.status(isNew ? 201 : 200).json({
      success: true,
      conversation: populated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating or retrieving conversation'
    });
  }
};

// @desc    Get all conversations for the authenticated user
// @route   GET /api/conversations
// @access  Private
exports.getUserConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const query = req.user.role === 'admin'
      ? {}
      : { $or: [{ tenant: userId }, { owner: userId }] };

    const conversations = await Conversation.find(query)
      .populate('property', 'title price images location propertyType')
      .populate('tenant', 'name email avatar role')
      .populate('owner', 'name email avatar role')
      .sort({ lastMessageAt: -1 });

    // Attach unread counts for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          recipient: userId,
          read: false
        });
        return {
          ...conv.toObject(),
          unreadCount
        };
      })
    );

    res.status(200).json({
      success: true,
      count: conversationsWithUnread.length,
      conversations: conversationsWithUnread
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching conversations'
    });
  }
};

// @desc    Get single conversation details by ID
// @route   GET /api/conversations/:id
// @access  Private
exports.getConversationById = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate('property', 'title price images location propertyType')
      .populate('tenant', 'name email avatar role')
      .populate('owner', 'name email avatar role');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Strict Authorization check: user must be participant or admin
    const userId = req.user.id;
    const isTenant = conversation.tenant && conversation.tenant._id.toString() === userId;
    const isOwner = conversation.owner && conversation.owner._id.toString() === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isTenant && !isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this conversation.'
      });
    }

    res.status(200).json({
      success: true,
      conversation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching conversation'
    });
  }
};

// @desc    Get messages for a conversation
// @route   GET /api/conversations/:id/messages
// @access  Private
exports.getConversationMessages = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Authorization check
    const userId = req.user.id;
    const isTenant = conversation.tenant.toString() === userId;
    const isOwner = conversation.owner.toString() === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isTenant && !isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to access these messages.'
      });
    }

    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const messages = await Message.find({ conversation: conversation._id })
      .populate('sender', 'name avatar role')
      .sort({ createdAt: 1 })
      .limit(limit);

    // Mark unread messages sent to the current user as read
    await Message.updateMany(
      {
        conversation: conversation._id,
        recipient: userId,
        read: false
      },
      { read: true }
    );

    res.status(200).json({
      success: true,
      count: messages.length,
      messages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching messages'
    });
  }
};

// @desc    Send a message within a conversation
// @route   POST /api/conversations/:id/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message text cannot be empty'
      });
    }

    const sanitizedText = text.trim().substring(0, 2000);
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Authorization check
    const userId = req.user.id;
    const isTenant = conversation.tenant.toString() === userId;
    const isOwner = conversation.owner.toString() === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isTenant && !isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to send messages in this conversation.'
      });
    }

    // Determine recipient
    const recipientId = isTenant ? conversation.owner : conversation.tenant;

    const message = await Message.create({
      conversation: conversation._id,
      sender: userId,
      recipient: recipientId,
      text: sanitizedText
    });

    // Update conversation metadata
    conversation.lastMessage = sanitizedText;
    conversation.lastMessageSender = userId;
    conversation.lastMessageAt = Date.now();
    await conversation.save();

    // Notify recipient in-app
    await Notification.create({
      recipient: recipientId,
      sender: userId,
      type: 'general',
      title: `New message from ${req.user.name}`,
      message: sanitizedText.length > 75 ? sanitizedText.substring(0, 72) + '...' : sanitizedText,
      link: `/messages?conversationId=${conversation._id}`
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name avatar role');

    res.status(201).json({
      success: true,
      message: populatedMessage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error sending message'
    });
  }
};
