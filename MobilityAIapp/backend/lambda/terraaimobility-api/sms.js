/**
 * sms.js — SMS / OTP delivery for aimobility
 *
 * Replaces GoGrab's Utility::sendSmsVerification() and
 * Utility::sendSmsVerificationCurl() from:
 *   php-api/mobileapp_api/app/Lib/Utility.php
 *
 * Strategy:
 *  1. Primary:   AWS SNS SMS (no external dependency, IAM-auth, pay-per-SMS)
 *  2. Fallback:  Twilio REST API (credentials from Secrets Manager: terraai/twilio)
 *
 * OTP generation replaces GoGrab's Utility::randomNumber() pattern.
 *
 * Migration notes:
 *  - PHP constant TWILIO_ACCOUNTSID  → Secrets Manager: terraai/twilio.TWILIO_ACCOUNTSID
 *  - PHP constant TWILIO_AUTHTOKEN   → Secrets Manager: terraai/twilio.TWILIO_AUTHTOKEN
 *  - PHP constant TWILIO_NUMBER      → Secrets Manager: terraai/twilio.TWILIO_NUMBER
 *  - PHP constants NEXMO_* / TWILIO_URL → removed (SNS is primary now)
 *  - PHP constant VERIFICATION_PHONENO_MESSAGE → OTP_MESSAGE_PREFIX below
 */

const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const https = require('https');

const REGION = process.env.AWS_REGION || 'us-east-1';
const OTP_MESSAGE_PREFIX = process.env.VERIFICATION_PHONENO_MESSAGE || 'Your aimobility verification code is';
const OTP_EXPIRY_MINUTES = 10;

const sns = new SNSClient({ region: REGION });
const sm  = new SecretsManagerClient({ region: REGION });

// In-memory OTP store (Lambda warm instances only — for production use DynamoDB TTL)
// GoGrab used the `phone_no_verification` MySQL table for this.
// We use DynamoDB via db.js for persistence (see sendOtp / verifyOtp routes in index.js)
const otpStore = new Map();

/**
 * Generate a random N-digit OTP.
 * Replaces Utility::randomNumber($length)
 */
function generateOtp(length = 6) {
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10).toString();
  }
  return otp;
}

/**
 * Store OTP in memory with expiry.
 * In production this should use DynamoDB with TTL attribute.
 */
function storeOtp(phone, otp) {
  otpStore.set(phone, {
    otp,
    expiresAt: Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000,
  });
}

/**
 * Verify an OTP against stored value.
 * Returns true if valid, false if invalid or expired.
 */
function verifyStoredOtp(phone, otp) {
  const stored = otpStore.get(phone);
  if (!stored) return false;
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(phone);
    return false;
  }
  if (stored.otp !== otp) return false;
  otpStore.delete(phone); // OTP is single-use
  return true;
}

/**
 * Send SMS via AWS SNS (primary channel).
 * Replaces the cURL Twilio call in Utility::sendSmsVerificationCurl()
 *
 * @param {string} phoneNumber - E.164 format, e.g. +254712345678
 * @param {string} message     - SMS body text
 * @returns {Promise<{code: string, msg: string}>}
 */
async function sendSnsSms(phoneNumber, message) {
  const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
  try {
    const result = await sns.send(new PublishCommand({
      PhoneNumber: formattedPhone,
      Message: message,
      MessageAttributes: {
        'AWS.SNS.SMS.SenderID': {
          DataType: 'String',
          StringValue: 'aimobility',
        },
        'AWS.SNS.SMS.SMSType': {
          DataType: 'String',
          StringValue: 'Transactional',
        },
      },
    }));
    console.log('[sms] SNS SMS sent, MessageId:', result.MessageId);
    return { code: '200', msg: 'SMS sent via SNS', messageId: result.MessageId };
  } catch (e) {
    console.error('[sms] SNS SMS failed:', e.message);
    throw e;
  }
}

/**
 * Get Twilio credentials from Secrets Manager.
 */
let twilioCredsCache = null;
async function getTwilioCreds() {
  if (twilioCredsCache) return twilioCredsCache;
  try {
    const res = await sm.send(new GetSecretValueCommand({ SecretId: 'terraai/twilio' }));
    twilioCredsCache = JSON.parse(res.SecretString);
    return twilioCredsCache;
  } catch (e) {
    console.warn('[sms] Could not fetch Twilio creds:', e.message);
    return null;
  }
}

/**
 * Send SMS via Twilio REST API (fallback).
 * Mirrors Utility::sendSmsVerificationCurl() logic.
 *
 * @param {string} phoneNumber - E.164 format
 * @param {string} message     - SMS body
 * @returns {Promise<{code: string, msg: string}>}
 */
async function sendTwilioSms(phoneNumber, message) {
  const creds = await getTwilioCreds();
  if (!creds || !creds.TWILIO_ACCOUNTSID || !creds.TWILIO_AUTHTOKEN || !creds.TWILIO_NUMBER) {
    throw new Error('Twilio credentials not configured in Secrets Manager (terraai/twilio)');
  }

  const { TWILIO_ACCOUNTSID: sid, TWILIO_AUTHTOKEN: token, TWILIO_NUMBER: from } = creds;
  const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams({
      From: from,
      To:   formattedPhone,
      Body: message,
    }).toString();

    const auth = Buffer.from(`${sid}:${token}`).toString('base64');
    const options = {
      hostname: 'api.twilio.com',
      path: `/2010-04-01/Accounts/${sid}/Messages.json`,
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type':  'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300 && !parsed.code) {
            resolve({ code: '200', msg: 'SMS sent via Twilio', sid: parsed.sid });
          } else {
            resolve({ code: '400', msg: parsed.message || 'Twilio error', twilioCode: parsed.code });
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

/**
 * Send a verification SMS — tries SNS first, falls back to Twilio.
 * This is the primary entry point, replacing Utility::sendSmsVerification().
 *
 * @param {string} phoneNumber - Phone number (E.164 or local format)
 * @param {string} message     - Message text
 * @returns {Promise<{code: string, msg: string}>}
 */
async function sendVerificationSms(phoneNumber, message) {
  if (!phoneNumber) return { code: '400', msg: 'Phone number is required' };
  if (!message)     return { code: '400', msg: 'Message is required' };

  // Try SNS first
  try {
    return await sendSnsSms(phoneNumber, message);
  } catch (snsError) {
    console.warn('[sms] SNS failed, trying Twilio fallback:', snsError.message);

    // Try Twilio fallback
    try {
      return await sendTwilioSms(phoneNumber, message);
    } catch (twilioError) {
      console.error('[sms] Both SNS and Twilio failed:', twilioError.message);
      return {
        code: '400',
        msg: `SMS delivery failed. SNS: ${snsError.message}. Twilio: ${twilioError.message}`,
      };
    }
  }
}

/**
 * Generate and send an OTP to a phone number.
 * High-level helper used by the sendOtp / verifyPhoneNo routes.
 *
 * @param {string} phoneNumber
 * @returns {Promise<{code: string, msg: string, otp: string}>}
 */
async function sendOtp(phoneNumber) {
  const otp = generateOtp(6);
  const message = `${OTP_MESSAGE_PREFIX}: ${otp}. Valid for ${OTP_EXPIRY_MINUTES} minutes. Do not share this code.`;

  // Store OTP for later verification
  storeOtp(phoneNumber, otp);

  const result = await sendVerificationSms(phoneNumber, message);

  // In dev/test, always return the OTP for easier testing
  // (matching GoGrab's behavior of returning {otp:'1234'} from verifyPhoneNo)
  return { ...result, otp: process.env.NODE_ENV !== 'production' ? otp : undefined };
}

module.exports = {
  generateOtp,
  storeOtp,
  verifyStoredOtp,
  sendSnsSms,
  sendTwilioSms,
  sendVerificationSms,
  sendOtp,
  OTP_EXPIRY_MINUTES,
};
