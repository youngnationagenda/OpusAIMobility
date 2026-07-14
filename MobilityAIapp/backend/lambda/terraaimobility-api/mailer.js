/**
 * mailer.js — Amazon SES email sender for aimobility
 *
 * Replaces GoGrab's PHPMailer / Utility::sendMail() from:
 *   php-api/mobileapp_api/app/Lib/Utility.php
 *
 * Uses the verified SES identity: noreply@terraaimobility.com
 * Secrets pulled from: terraai/ses-smtp (for SMTP_PASSWORD if needed)
 *
 * Migration notes:
 *  - PHP constant MAIL_HOST        → SES endpoint (us-east-1)
 *  - PHP constant MAIL_FROM        → SENDER_EMAIL env var
 *  - PHP constant MAIL_NAME        → SENDER_NAME env var
 *  - PHP constant MAIL_REPLYTO     → reply-to header
 *  - PHP constant MAIL_PASSWORD    → not needed (IAM-based SES auth in Lambda)
 */

const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

const REGION = process.env.AWS_REGION || 'us-east-1';
const SENDER_EMAIL = process.env.MAIL_FROM    || 'noreply@opusaimobility.yna.co.ke';
const SENDER_NAME  = process.env.MAIL_NAME    || 'aimobility';
const REPLY_TO     = process.env.MAIL_REPLYTO || 'support@opusaimobility.yna.co.ke';

const ses = new SESClient({ region: REGION });
const sm  = new SecretsManagerClient({ region: REGION });

// Cache for SMTP creds (5 min TTL)
let _smtpCache = null; let _smtpCacheTs = 0;
async function getSmtpCreds() {
  if (_smtpCache && Date.now() - _smtpCacheTs < 300000) return _smtpCache;
  try {
    const r = await sm.send(new GetSecretValueCommand({ SecretId: 'terraai/ses-smtp' }));
    _smtpCache = JSON.parse(r.SecretString);
    _smtpCacheTs = Date.now();
    return _smtpCache;
  } catch (e) {
    console.warn('[mailer] Could not load ses-smtp secret:', e.message);
    return null;
  }
}

/**
 * Send an email via Amazon SES.
 *
 * @param {object} data
 * @param {string} data.to        - Recipient email
 * @param {string} data.name      - Recipient name
 * @param {string} data.subject   - Email subject
 * @param {string} data.message   - HTML body
 * @param {string} [data.text]    - Plain text fallback
 * @returns {Promise<{code: string, msg: string}>}
 */
async function sendMail(data) {
  if (!data || !data.to || !data.subject || !data.message) {
    return { code: '400', msg: 'Missing required email fields: to, subject, message' };
  }

  const params = {
    Source: `${SENDER_NAME} <${SENDER_EMAIL}>`,
    ReplyToAddresses: [REPLY_TO],
    Destination: {
      ToAddresses: [data.name ? `${data.name} <${data.to}>` : data.to],
    },
    Message: {
      Subject: {
        Data: data.subject,
        Charset: 'UTF-8',
      },
      Body: {
        Html: {
          Data: data.message,
          Charset: 'UTF-8',
        },
        ...(data.text ? { Text: { Data: data.text, Charset: 'UTF-8' } } : {}),
      },
    },
  };

  try {
    const result = await ses.send(new SendEmailCommand(params));
    console.log('[mailer] SES sent OK, MessageId:', result.MessageId);
    return { code: '200', msg: 'Email sent successfully', messageId: result.MessageId };
  } catch (e) {
    console.error('[mailer] SES send failed:', e.message, e.code);
    return { code: '400', msg: 'Email send failed: ' + e.message };
  }
}

/**
 * Send a welcome email to a new user.
 * Replaces GoGrab CustomEmail::welcomeStudentEmail()
 */
async function sendWelcomeEmail(email, firstName) {
  return sendMail({
    to: email,
    name: firstName,
    subject: 'Welcome to aimobility! 🚀',
    message: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="color:#1a1a2e">Welcome to aimobility, ${firstName}!</h2>
        <p>Your account has been created successfully.</p>
        <p>You can now book rides, order food, and send parcels — all in one app.</p>
        <p style="margin-top:32px;color:#666;font-size:13px">
          The aimobility team<br>
          <a href="https://terraaimobility.com">terraaimobility.com</a>
        </p>
      </div>
    `,
    text: `Welcome to aimobility, ${firstName}! Your account has been created successfully.`,
  });
}

/**
 * Send a password reset / OTP email.
 * Replaces GoGrab's token-based email verification
 */
async function sendOtpEmail(email, firstName, otp) {
  return sendMail({
    to: email,
    name: firstName,
    subject: 'Your aimobility verification code',
    message: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="color:#1a1a2e">Verification Code</h2>
        <p>Hi ${firstName},</p>
        <p>Your verification code is:</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#e63946;margin:24px 0">
          ${otp}
        </div>
        <p style="color:#666">This code expires in 10 minutes. Do not share it with anyone.</p>
        <p style="margin-top:32px;color:#666;font-size:13px">The aimobility team</p>
      </div>
    `,
    text: `Your aimobility verification code is: ${otp}. It expires in 10 minutes.`,
  });
}

/**
 * Send order confirmation email.
 * Replaces GoGrab's order notification flow
 */
async function sendOrderConfirmationEmail(email, firstName, orderId, orderType) {
  const typeLabel = orderType === 'food' ? 'food order' : orderType === 'parcel' ? 'parcel delivery' : 'ride';
  return sendMail({
    to: email,
    name: firstName,
    subject: `Your aimobility ${typeLabel} is confirmed! #${orderId.slice(-8).toUpperCase()}`,
    message: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="color:#1a1a2e">Order Confirmed ✅</h2>
        <p>Hi ${firstName},</p>
        <p>Your ${typeLabel} <strong>#${orderId.slice(-8).toUpperCase()}</strong> has been placed successfully.</p>
        <p>You can track your order in the aimobility app.</p>
        <p style="margin-top:32px;color:#666;font-size:13px">The aimobility team</p>
      </div>
    `,
    text: `Your aimobility ${typeLabel} #${orderId.slice(-8).toUpperCase()} is confirmed!`,
  });
}

/**
 * Send driver assignment notification email to rider
 * Replaces GoGrab's Utility::sendPushNotificationToMobileDevice for email channel
 */
async function sendDriverAssignedEmail(email, firstName, driverName, eta) {
  return sendMail({
    to: email,
    name: firstName,
    subject: 'Your driver is on the way! 🚗',
    message: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="color:#1a1a2e">Driver Assigned</h2>
        <p>Hi ${firstName},</p>
        <p>Your driver <strong>${driverName}</strong> is on the way.</p>
        <p>Estimated arrival: <strong>${eta || '5-10 minutes'}</strong></p>
        <p style="margin-top:32px;color:#666;font-size:13px">The aimobility team</p>
      </div>
    `,
    text: `Your driver ${driverName} is on the way. ETA: ${eta || '5-10 minutes'}.`,
  });
}

module.exports = {
  sendMail,
  sendWelcomeEmail,
  sendOtpEmail,
  sendOrderConfirmationEmail,
  sendDriverAssignedEmail,
};
