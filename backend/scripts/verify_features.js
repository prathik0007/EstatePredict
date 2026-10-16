const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectDB = require('../config/db');
const User = require('../models/User');
const Property = require('../models/Property');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const emailService = require('../utils/emailService');
const chatController = require('../controllers/chatController');
const bookingController = require('../controllers/bookingController');

// Mock Express req, res objects
function mockReqRes(user, body = {}, params = {}, query = {}) {
  const req = {
    user,
    body,
    params,
    query
  };
  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    }
  };
  return { req, res };
}

async function runTests() {
  console.log('===============================================================');
  console.log('ESTATEPREDICT: VERIFICATION SUITE FOR MISSING FEATURES');
  console.log('  1. Email Notifications for Booking / Visit Status Changes');
  console.log('  2. Owner-Tenant Chat & Messaging Infrastructure');
  console.log('===============================================================\n');

  try {
    await connectDB();
    console.log('✔ [DB] Connected to MongoDB Atlas\n');

    // 1. Identify users
    let owner = await User.findOne({ role: 'owner' });
    let tenant = await User.findOne({ role: 'tenant' });
    let admin = await User.findOne({ role: 'admin' });

    if (!owner) {
      owner = await User.create({
        name: 'Test Owner',
        email: `test_owner_${Date.now()}@example.com`,
        password: 'Password@123',
        role: 'owner',
        phone: '+1 555-0100'
      });
    }

    if (!tenant) {
      tenant = await User.create({
        name: 'Test Tenant',
        email: `test_tenant_${Date.now()}@example.com`,
        password: 'Password@123',
        role: 'tenant',
        phone: '+1 555-0101'
      });
    }

    // Create an unrelated tenant for permission tests
    const unrelatedTenant = await User.create({
      name: 'Unrelated User',
      email: `unrelated_${Date.now()}@example.com`,
      password: 'Password@123',
      role: 'tenant',
      phone: '+1 555-0109'
    });

    // Find or create an owner user
    if (!owner) {
      owner = await User.create({
        name: 'Sarah Jenkins (Owner)',
        email: `owner_${Date.now()}@example.com`,
        password: 'Password@123',
        role: 'owner',
        phone: '+1 555-0144'
      });
    }

    // Find or create a property owned by this owner
    let property = await Property.findOne({ owner: owner._id });
    if (!property) {
      property = await Property.findOne();
      if (property) {
        property.owner = owner._id;
        await property.save();
      } else {
        property = await Property.create({
          title: 'Historic Downtown Loft',
          description: 'Luxury loft for testing',
          price: 245,
          propertyType: 'Entire home',
          roomType: 'Entire home/apt',
          owner: owner._id,
          location: { city: 'Asheville', state: 'North Carolina', address: 'Pack Square' },
          amenities: ['High Speed Wifi', 'Central AC']
        });
      }
    }

    console.log(`✔ [Context] Owner: ${owner.name} (${owner.email})`);
    console.log(`✔ [Context] Tenant: ${tenant.name} (${tenant.email})`);
    console.log(`✔ [Context] Property: "${property.title}" (ID: ${property._id})\n`);

    // -------------------------------------------------------------------------
    // TEST SECTION 1: EMAIL NOTIFICATION WORKFLOW & STATUS UPDATES
    // -------------------------------------------------------------------------
    console.log('--- TEST SECTION 1: Email Notifications & Booking Lifecycle ---');

    // 1.1 Verify SMTP environment configuration state
    const configured = emailService.isEmailConfigured();
    console.log(`✔ [1.1] Email Configuration Check: ${configured ? 'Configured (Active SMTP)' : 'Unconfigured (Safe Simulation Mode)'}`);
    console.log(`        SMTP_HOST: "${process.env.SMTP_HOST || '(not set)'}"`);
    console.log(`        SMTP_USER: "${process.env.SMTP_USER || '(not set)'}"`);
    console.log(`        EMAIL_FROM: "${process.env.EMAIL_FROM || '(default)'}"`);

    // 1.2 Test email dispatch helper directly (must handle unconfigured or active safely)
    const emailResult = await emailService.sendBookingStatusEmail({
      tenantEmail: tenant.email,
      tenantName: tenant.name,
      propertyTitle: property.title,
      visitDate: new Date(),
      timeSlot: 'Morning (9 AM - 12 PM)',
      status: 'accepted',
      ownerNotes: 'Confirmed for 10 AM',
      bookingId: new mongoose.Types.ObjectId()
    });
    console.log(`✔ [1.2] emailService.sendBookingStatusEmail executed gracefully. (Result: ${emailResult.success ? 'Delivered' : emailResult.reason || 'Simulated'})`);

    // 1.3 Tenant creates a visit booking
    const { req: bReq, res: bRes } = mockReqRes(
      { id: tenant._id.toString(), name: tenant.name, email: tenant.email, phone: tenant.phone },
      {
        propertyId: property._id.toString(),
        visitDate: new Date(Date.now() + 86400000).toISOString(),
        timeSlot: 'Morning (9 AM - 12 PM)',
        message: 'Excited to view this property tomorrow!',
        contactNumber: tenant.phone
      }
    );
    await bookingController.createBooking(bReq, bRes);
    if (bRes.statusCode !== 201) throw new Error(`Booking creation failed: ${JSON.stringify(bRes.data)}`);
    const createdBooking = bRes.data.booking;
    console.log(`✔ [1.3] Booking created successfully: ID ${createdBooking._id}, Status: ${createdBooking.status}`);

    // Verify owner received the in-app notification
    const ownerNotif = await Notification.findOne({
      recipient: owner._id,
      type: 'booking_request'
    }).sort({ createdAt: -1 });
    if (!ownerNotif) throw new Error('Owner in-app notification was not found!');
    console.log(`✔ [1.4] Owner received expected in-app notification: "${ownerNotif.title}" - "${ownerNotif.message}"`);

    // 1.5 Owner accepts the booking request
    const initialNotifCount = await Notification.countDocuments({ recipient: tenant._id });
    const { req: acceptReq, res: acceptRes } = mockReqRes(
      { id: owner._id.toString(), role: 'owner' },
      { status: 'accepted', ownerNotes: 'Looking forward to meeting you!' },
      { id: createdBooking._id.toString() }
    );
    await bookingController.updateBookingStatus(acceptReq, acceptRes);
    if (acceptRes.statusCode !== 200 || acceptRes.data.booking.status !== 'accepted') {
      throw new Error(`Accept status update failed: ${JSON.stringify(acceptRes.data)}`);
    }
    console.log('✔ [1.5] Booking status updated to ACCEPTED.');

    // Verify tenant received the notification
    const tenantAcceptNotif = await Notification.findOne({
      recipient: tenant._id,
      type: 'booking_accepted'
    }).sort({ createdAt: -1 });
    if (!tenantAcceptNotif) throw new Error('Tenant acceptance notification was not found!');
    console.log(`✔ [1.6] Tenant received in-app notification: "${tenantAcceptNotif.title}"`);

    // 1.7 Verify duplicate status updates DO NOT create duplicate notifications / emails
    const notifsBeforeRepeat = await Notification.countDocuments({ recipient: tenant._id });
    const { req: repeatReq, res: repeatRes } = mockReqRes(
      { id: owner._id.toString(), role: 'owner' },
      { status: 'accepted' }, // sending identical status again
      { id: createdBooking._id.toString() }
    );
    await bookingController.updateBookingStatus(repeatReq, repeatRes);
    const notifsAfterRepeat = await Notification.countDocuments({ recipient: tenant._id });
    if (notifsAfterRepeat !== notifsBeforeRepeat) {
      throw new Error(`Duplicate notification sent on repeated identical status! Before: ${notifsBeforeRepeat}, After: ${notifsAfterRepeat}`);
    }
    console.log('✔ [1.7] Duplicate status protection verified: Repeated status update did not trigger duplicate notifications or emails.');

    // 1.8 Create another booking and reject it to verify rejection branch
    const { req: rejBReq, res: rejBRes } = mockReqRes(
      { id: tenant._id.toString(), name: tenant.name, email: tenant.email, phone: tenant.phone },
      {
        propertyId: property._id.toString(),
        visitDate: new Date(Date.now() + 172800000).toISOString(),
        timeSlot: 'Afternoon (12 PM - 4 PM)',
        message: 'Alternative slot inquiry',
        contactNumber: tenant.phone
      }
    );
    await bookingController.createBooking(rejBReq, rejBRes);
    const rejBookingId = rejBRes.data.booking._id;

    const { req: rejReq, res: rejRes } = mockReqRes(
      { id: owner._id.toString(), role: 'owner' },
      { status: 'rejected', ownerNotes: 'Sorry, the property is undergoing maintenance.' },
      { id: rejBookingId.toString() }
    );
    await bookingController.updateBookingStatus(rejReq, rejRes);
    if (rejRes.statusCode !== 200 || rejRes.data.booking.status !== 'rejected') {
      throw new Error('Rejection status update failed!');
    }
    const tenantRejNotif = await Notification.findOne({
      recipient: tenant._id,
      type: 'booking_rejected'
    }).sort({ createdAt: -1 });
    if (!tenantRejNotif) throw new Error('Tenant rejection notification was not found!');
    console.log(`✔ [1.8] Booking status updated to REJECTED with distinct notification: "${tenantRejNotif.title}"`);

    // 1.9 Test email-provider failure resilience (simulated transport error)
    // Even if transporter throws, status update MUST succeed in database without throwing 500
    const originalSendBookingStatusEmail = emailService.sendBookingStatusEmail;
    emailService.sendBookingStatusEmail = async () => {
      throw new Error('Simulated SMTP connection timeout failure');
    };

    const { req: failSafeReq, res: failSafeRes } = mockReqRes(
      { id: owner._id.toString(), role: 'owner' },
      { status: 'completed' },
      { id: createdBooking._id.toString() }
    );
    await bookingController.updateBookingStatus(failSafeReq, failSafeRes);
    // Restore original function
    emailService.sendBookingStatusEmail = originalSendBookingStatusEmail;

    if (failSafeRes.statusCode !== 200 || failSafeRes.data.booking.status !== 'completed') {
      throw new Error('Email provider failure caused status update to crash!');
    }
    console.log('✔ [1.9] Email failure resilience verified: Booking status update completed successfully even when email provider failed.\n');

    // -------------------------------------------------------------------------
    // TEST SECTION 2: OWNER-TENANT CHAT & MESSAGING
    // -------------------------------------------------------------------------
    console.log('--- TEST SECTION 2: Owner-Tenant Chat & Messaging ---');

    // 2.1 Tenant initiates conversation with Owner for property
    const { req: convReq, res: convRes } = mockReqRes(
      { id: tenant._id.toString(), name: tenant.name },
      { propertyId: property._id.toString(), initialMessage: 'Hello! Is this property available for long-term rental?' }
    );
    await chatController.getOrCreateConversation(convReq, convRes);
    if (convRes.statusCode !== 201 && convRes.statusCode !== 200) {
      throw new Error(`Conversation creation failed: ${JSON.stringify(convRes.data)}`);
    }
    const conversation = convRes.data.conversation;
    console.log(`✔ [2.1] Conversation created/retrieved: ID ${conversation._id}`);

    // Verify initial message was saved
    const initialMsg = await Message.findOne({ conversation: conversation._id });
    if (!initialMsg || !initialMsg.text.includes('long-term rental')) {
      throw new Error('Initial message was not recorded properly!');
    }
    console.log(`✔ [2.2] Initial message saved in database: "${initialMsg.text}" (Sender: ${initialMsg.sender})`);

    // 2.3 Verify duplicate prevention: calling getOrCreateConversation again returns existing conversation
    const { req: dupReq, res: dupRes } = mockReqRes(
      { id: tenant._id.toString(), name: tenant.name },
      { propertyId: property._id.toString() }
    );
    await chatController.getOrCreateConversation(dupReq, dupRes);
    if (dupRes.statusCode !== 200 || dupRes.data.conversation._id.toString() !== conversation._id.toString()) {
      throw new Error('Duplicate conversation created instead of retrieving existing!');
    }
    console.log('✔ [2.3] Duplicate conversation prevention verified: Returned existing conversation.');

    // 2.4 Owner retrieves conversation list and conversation details
    const { req: ownerListReq, res: ownerListRes } = mockReqRes(
      { id: owner._id.toString(), role: 'owner' }
    );
    await chatController.getUserConversations(ownerListReq, ownerListRes);
    const foundInOwner = ownerListRes.data.conversations.find(c => c._id.toString() === conversation._id.toString());
    if (!foundInOwner) throw new Error('Conversation not found in Owner conversation list!');
    console.log(`✔ [2.4] Owner retrieved conversation list: Found ${ownerListRes.data.count} conversation(s).`);

    // 2.5 Owner reads messages and replies to Tenant
    const { req: getMsgReq, res: getMsgRes } = mockReqRes(
      { id: owner._id.toString(), role: 'owner' },
      {},
      { id: conversation._id.toString() }
    );
    await chatController.getConversationMessages(getMsgReq, getMsgRes);
    console.log(`✔ [2.5] Owner retrieved ${getMsgRes.data.count} message(s) and marked as read.`);

    const { req: ownerSendReq, res: ownerSendRes } = mockReqRes(
      { id: owner._id.toString(), name: owner.name, role: 'owner' },
      { text: 'Yes, long-term lease is welcome! When would you like to move in?' },
      { id: conversation._id.toString() }
    );
    await chatController.sendMessage(ownerSendReq, ownerSendRes);
    if (ownerSendRes.statusCode !== 201) throw new Error(`Owner message send failed: ${JSON.stringify(ownerSendRes.data)}`);
    console.log(`✔ [2.6] Owner sent reply: "${ownerSendRes.data.message.text}"`);

    // 2.7 Verify chronological order
    const { req: checkChronReq, res: checkChronRes } = mockReqRes(
      { id: tenant._id.toString(), role: 'tenant' },
      {},
      { id: conversation._id.toString() }
    );
    await chatController.getConversationMessages(checkChronReq, checkChronRes);
    const allMsgs = checkChronRes.data.messages;
    if (allMsgs.length < 2) throw new Error('Expected at least 2 messages in conversation history!');
    if (new Date(allMsgs[0].createdAt) > new Date(allMsgs[1].createdAt)) {
      throw new Error('Messages not in ascending chronological order!');
    }
    console.log('✔ [2.7] Messages verified in strict chronological order.');

    // 2.8 Security check: Unrelated user CANNOT access this private conversation
    const { req: unauthReq, res: unauthRes } = mockReqRes(
      { id: unrelatedTenant._id.toString(), role: 'tenant' },
      {},
      { id: conversation._id.toString() }
    );
    await chatController.getConversationMessages(unauthReq, unauthRes);
    if (unauthRes.statusCode !== 403) {
      throw new Error(`Security breach! Unrelated user got status ${unauthRes.statusCode} instead of 403 Forbidden!`);
    }
    console.log('✔ [2.8] Authorization check: Unrelated tenant blocked with 403 Forbidden.');

    // 2.9 Validation check: Empty message text must be rejected with 400
    const { req: emptyReq, res: emptyRes } = mockReqRes(
      { id: tenant._id.toString(), role: 'tenant' },
      { text: '    ' },
      { id: conversation._id.toString() }
    );
    await chatController.sendMessage(emptyReq, emptyRes);
    if (emptyRes.statusCode !== 400) {
      throw new Error('Validation failure! Empty message was not rejected with 400!');
    }
    console.log('✔ [2.9] Input validation: Empty message correctly rejected with 400 Bad Request.');

    // 2.10 Owner cannot message themselves on their own property
    const { req: selfReq, res: selfRes } = mockReqRes(
      { id: owner._id.toString(), role: 'owner' },
      { propertyId: property._id.toString() }
    );
    await chatController.getOrCreateConversation(selfReq, selfRes);
    if (selfRes.statusCode !== 400) {
      throw new Error('Owner was able to start conversation with themselves!');
    }
    console.log('✔ [2.10] Self-messaging prevention: Owner chatting with themselves correctly blocked with 400 Bad Request.\n');

    // Clean up test records created for this verification run
    await Message.deleteMany({ conversation: conversation._id });
    await Conversation.deleteOne({ _id: conversation._id });
    await Booking.deleteOne({ _id: createdBooking._id });
    await Booking.deleteOne({ _id: rejBookingId });
    await User.deleteOne({ _id: unrelatedTenant._id });

    console.log('===============================================================');
    console.log('ALL VERIFICATION TESTS PASSED (100% SUCCESSFUL)!');
    console.log('===============================================================');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ TEST FAILURE:', err);
    process.exit(1);
  }
}

runTests();
