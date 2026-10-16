const nodemailer = require('nodemailer');

/**
 * Check if SMTP credentials are configured in the environment.
 */
const isEmailConfigured = () => {
  return Boolean(
    (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) ||
    (process.env.EMAIL_SERVICE && process.env.SMTP_USER && process.env.SMTP_PASS)
  );
};

/**
 * Create a nodemailer transporter instance.
 */
const getTransporter = () => {
  if (process.env.EMAIL_SERVICE) {
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  const port = Number(process.env.SMTP_PORT) || 587;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    // Optional timeout settings to prevent hung sockets
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 15000
  });
};

/**
 * Generic email sender with robust error handling and logging.
 * Returns delivery outcome without throwing exceptions.
 */
const sendEmail = async ({ to, subject, text, html }) => {
  if (!to) {
    console.warn('[EmailService] Recipient email is missing. Skipping.');
    return { success: false, reason: 'missing_recipient' };
  }

  if (!isEmailConfigured()) {
    console.log(`[EmailService] SMTP credentials unconfigured. Simulated dispatch to: <${to}> | Subject: "${subject}"`);
    return {
      success: false,
      reason: 'unconfigured',
      message: 'SMTP credentials not configured in environment variables'
    };
  }

  try {
    const transporter = getTransporter();
    const fromAddress = process.env.EMAIL_FROM || `"EstatePredict" <${process.env.SMTP_USER}>`;

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text,
      html
    });

    console.log(`[EmailService] Email successfully sent to <${to}> (ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    // Log error cleanly without leaking credentials
    console.error(`[EmailService] Delivery failed to <${to}>:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Notify Property Owner about a new booking / visit request.
 */
const sendNewBookingEmail = async ({
  ownerEmail,
  ownerName,
  tenantName,
  tenantEmail,
  tenantPhone,
  propertyTitle,
  visitDate,
  timeSlot,
  message,
  bookingId
}) => {
  const clientBase = process.env.CLIENT_URL || 'http://localhost:5173';
  const actionUrl = `${clientBase}/owner/dashboard`;
  const formattedDate = visitDate ? new Date(visitDate).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }) : 'To be confirmed';

  const subject = `New Visit Request for "${propertyTitle}" - EstatePredict`;

  const text = `Hello ${ownerName || 'Property Host'},

You have received a new site-visit / booking request from ${tenantName || 'a prospective tenant'}.

Property: ${propertyTitle}
Requested Date: ${formattedDate}
Preferred Time Slot: ${timeSlot || 'Morning (9 AM - 12 PM)'}
Contact Phone: ${tenantPhone || 'Not provided'}
${message ? `Tenant Message: "${message}"\n` : ''}
Review and respond to this request on your Host Dashboard:
${actionUrl}

Best regards,
The EstatePredict Team`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
        .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .header { background: linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%); padding: 28px 24px; color: #ffffff; text-align: center; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 800; }
        .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.9; }
        .content { padding: 28px 24px; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; background: #fef3c7; color: #b45309; }
        .details-box { background: #f1f5f9; border-radius: 8px; padding: 16px 20px; margin: 20px 0; }
        .details-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
        .details-row:last-child { border-bottom: none; }
        .label { color: #64748b; font-weight: 600; }
        .value { color: #0f172a; font-weight: 700; text-align: right; }
        .note-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; margin: 16px 0; font-style: italic; font-size: 13px; color: #1e40af; }
        .btn { display: inline-block; background: #2563eb; color: #ffffff !important; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 14px; text-align: center; margin: 16px 0; }
        .footer { text-align: center; font-size: 12px; color: #94a3b8; padding: 20px; border-top: 1px solid #f1f5f9; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>EstatePredict</h1>
          <p>Online Property Rental & Multimodal ML Valuation</p>
        </div>
        <div class="content">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 16px;">
            <h2 style="margin:0; font-size: 18px; color:#0f172a;">New Visit Booking Request</h2>
            <span class="badge">PENDING REVIEW</span>
          </div>
          <p style="font-size: 14px; color:#475569; margin: 0 0 16px;">
            Hello <strong>${ownerName || 'Host'}</strong>, <strong>${tenantName || 'A prospective tenant'}</strong> has requested a site visit for your listing.
          </p>
          <div class="details-box">
            <div class="details-row">
              <span class="label">Property</span>
              <span class="value">${propertyTitle}</span>
            </div>
            <div class="details-row">
              <span class="label">Requested Date</span>
              <span class="value">${formattedDate}</span>
            </div>
            <div class="details-row">
              <span class="label">Time Slot</span>
              <span class="value">${timeSlot || 'Morning (9 AM - 12 PM)'}</span>
            </div>
            <div class="details-row">
              <span class="label">Tenant Contact</span>
              <span class="value">${tenantPhone || 'Not provided'} (${tenantEmail || 'Email'})</span>
            </div>
          </div>
          ${message ? `
            <div class="note-box">
              <strong>Tenant Message:</strong> "${message}"
            </div>
          ` : ''}
          <div style="text-align: center; margin-top: 24px;">
            <a href="${actionUrl}" class="btn">Manage Booking Request</a>
          </div>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} EstatePredict. Preserving fair rental valuations with multimodal ML.
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: ownerEmail, subject, text, html });
};

/**
 * Notify Tenant when Property Owner updates booking status (Accepted / Rejected).
 */
const sendBookingStatusEmail = async ({
  tenantEmail,
  tenantName,
  propertyTitle,
  visitDate,
  timeSlot,
  status,
  ownerNotes,
  bookingId
}) => {
  const clientBase = process.env.CLIENT_URL || 'http://localhost:5173';
  const actionUrl = `${clientBase}/tenant/dashboard`;
  const formattedDate = visitDate ? new Date(visitDate).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }) : 'Scheduled date';

  const isAccepted = status === 'accepted';
  const statusColor = isAccepted ? '#10b981' : '#ef4444';
  const statusBg = isAccepted ? '#ecfdf5' : '#fef2f2';
  const statusBadge = isAccepted ? 'ACCEPTED' : (status === 'rejected' ? 'DECLINED' : status.toUpperCase());

  const subject = isAccepted
    ? `Booking Confirmed: Visit Approved for "${propertyTitle}"`
    : `Booking Update: Visit Request Declined for "${propertyTitle}"`;

  const text = `Hello ${tenantName || 'Guest'},

Your site-visit / reservation request for "${propertyTitle}" has been ${isAccepted ? 'ACCEPTED' : 'DECLINED'} by the property host.

Status: ${statusBadge}
Property: ${propertyTitle}
Date: ${formattedDate}
Time Slot: ${timeSlot || 'Morning (9 AM - 12 PM)'}
${ownerNotes ? `Host Note: "${ownerNotes}"\n` : ''}
View your booking details on your Guest Dashboard:
${actionUrl}

Best regards,
The EstatePredict Team`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
        .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .header { background: linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%); padding: 28px 24px; color: #ffffff; text-align: center; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 800; }
        .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.9; }
        .content { padding: 28px 24px; }
        .status-pill { display: inline-block; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 800; text-transform: uppercase; background: ${statusBg}; color: ${statusColor}; border: 1px solid ${statusColor}; }
        .details-box { background: #f8fafc; border-radius: 8px; padding: 16px 20px; margin: 20px 0; border: 1px solid #e2e8f0; }
        .details-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
        .details-row:last-child { border-bottom: none; }
        .label { color: #64748b; font-weight: 600; }
        .value { color: #0f172a; font-weight: 700; text-align: right; }
        .note-box { background: ${isAccepted ? '#eff6ff' : '#fef2f2'}; border-left: 4px solid ${statusColor}; padding: 12px 16px; margin: 16px 0; font-size: 13px; color: #334155; }
        .btn { display: inline-block; background: #2563eb; color: #ffffff !important; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 14px; text-align: center; margin: 16px 0; }
        .footer { text-align: center; font-size: 12px; color: #94a3b8; padding: 20px; border-top: 1px solid #f1f5f9; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>EstatePredict</h1>
          <p>Online Property Rental & Multimodal ML Valuation</p>
        </div>
        <div class="content">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 16px;">
            <h2 style="margin:0; font-size: 18px; color:#0f172a;">Booking Request Status Update</h2>
            <span class="status-pill">${statusBadge}</span>
          </div>
          <p style="font-size: 14px; color:#475569; margin: 0 0 16px;">
            Hello <strong>${tenantName || 'Guest'}</strong>, your site visit request has been updated by the property host.
          </p>
          <div class="details-box">
            <div class="details-row">
              <span class="label">Property</span>
              <span class="value">${propertyTitle}</span>
            </div>
            <div class="details-row">
              <span class="label">Scheduled Date</span>
              <span class="value">${formattedDate}</span>
            </div>
            <div class="details-row">
              <span class="label">Time Slot</span>
              <span class="value">${timeSlot || 'Morning (9 AM - 12 PM)'}</span>
            </div>
            <div class="details-row">
              <span class="label">Updated Status</span>
              <span class="value" style="color: ${statusColor};">${statusBadge}</span>
            </div>
          </div>
          ${ownerNotes ? `
            <div class="note-box">
              <strong>Host Feedback:</strong> "${ownerNotes}"
            </div>
          ` : ''}
          <div style="text-align: center; margin-top: 24px;">
            <a href="${actionUrl}" class="btn">View in Guest Dashboard</a>
          </div>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} EstatePredict. Preserving fair rental valuations with multimodal ML.
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: tenantEmail, subject, text, html });
};

module.exports = {
  isEmailConfigured,
  sendEmail,
  sendNewBookingEmail,
  sendBookingStatusEmail
};
