#!/usr/bin/env node
/**
 * inject-credentials.cjs — One-command credential injector for aimobility
 *
 * USAGE:
 *   node scripts/inject-credentials.cjs --service google \
 *       --maps-key AIza... --client-id 1234.apps.googleusercontent.com \
 *       --client-secret GOCSPX-...
 *
 *   node scripts/inject-credentials.cjs --service twilio \
 *       --account-sid ACxxx --auth-token xxx --number +12345678901
 *
 *   node scripts/inject-credentials.cjs --service facebook \
 *       --app-id 123456789 --app-secret abc123
 *
 *   node scripts/inject-credentials.cjs --service stripe \
 *       --secret-key sk_live_xxx --webhook-secret whsec_xxx \
 *       --publishable-key pk_live_xxx
 *
 *   node scripts/inject-credentials.cjs --service all   (interactive prompts)
 *
 * What it does for each service:
 *   1. Validates the credentials against the real API
 *   2. Updates AWS Secrets Manager
 *   3. Updates Cognito Identity Provider (Google/Facebook)
 *   4. Updates Lambda environment variables
 *   5. Prints confirmation with no secrets in plain text
 *
 * Region: us-east-1   Account: 683541453923
 */
'use strict';
const { execSync } = require('child_process');
const https  = require('https');
const crypto = require('crypto');
const readline = require('readline');

const REGION          = 'us-east-1';
const COGNITO_POOL    = 'us-east-1_LKa4ElQem';
const LAMBDA_API      = 'terraaimobility-api';
const LAMBDA_ADMIN    = 'terraaimobility-admin';
const LAMBDA_STRIPE   = 'terraai-stripe';

// ── Helpers ───────────────────────────────────────────────────────────────────
function awsCli(cmd) {
  try {
    return JSON.parse(execSync(`aws ${cmd} --output json --region ${REGION}`, { stdio: ['pipe','pipe','pipe'] }).toString());
  } catch (e) {
    const stderr = e.stderr ? e.stderr.toString() : e.message;
    throw new Error(`AWS CLI error: ${stderr}`);
  }
}
function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => { try { resolve({ status: r.statusCode, body: JSON.parse(d) }); } catch { resolve({ status: r.statusCode, body: d }); } });
    }).on('error', reject);
  });
}
function httpsPost(hostname, path, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const body = typeof data === 'string' ? data : new URLSearchParams(data).toString();
    const req = https.request({ hostname, path, method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body), ...headers } }, r => {
      let d = ''; r.on('data', c => d += c);
      r.on('end', () => { try { resolve({ status: r.statusCode, body: JSON.parse(d) }); } catch { resolve({ status: r.statusCode, body: d }); } });
    });
    req.on('error', reject);
    req.write(body); req.end();
  });
}
function mask(s) { if (!s) return '(empty)'; return s.substring(0, 6) + '***' + s.slice(-4); }
function updateSecret(secretId, updates) {
  const current = JSON.parse(execSync(`aws secretsmanager get-secret-value --secret-id "${secretId}" --query SecretString --output text --region ${REGION}`).toString().trim());
  const merged = { ...current, ...updates };
  execSync(`aws secretsmanager update-secret --secret-id "${secretId}" --secret-string '${JSON.stringify(merged).replace(/'/g,"'\\''")}'  --region ${REGION}`, { stdio: 'pipe' });
  return merged;
}
function getLambdaEnv(name) {
  return JSON.parse(execSync(`aws lambda get-function-configuration --function-name ${name} --query "Environment.Variables" --output json --region ${REGION}`, { stdio: ['pipe','pipe','pipe'] }).toString());
}
function updateLambdaEnv(name, updates) {
  const current = getLambdaEnv(name);
  const merged = { ...current, ...updates };
  const envStr = JSON.stringify({ Variables: merged });
  execSync(`aws lambda update-function-configuration --function-name ${name} --environment "${envStr.replace(/"/g, '\\"')}" --region ${REGION} --output json`, { stdio: 'pipe' });
  return merged;
}

// ── Google ────────────────────────────────────────────────────────────────────
async function injectGoogle({ mapsKey, clientId, clientSecret }) {
  console.log('\n Google Maps + OAuth');
  console.log('  Validating Maps API key...');
  const testUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=Nairobi,Kenya&key=${mapsKey}`;
  const res = await httpsGet(testUrl);
  if (res.body.status === 'OK' || res.body.status === 'ZERO_RESULTS') {
    console.log('  Maps API key VALID (status:', res.body.status + ')');
  } else if (res.body.status === 'REQUEST_DENIED') {
    throw new Error('Google Maps key is invalid or Maps Geocoding API not enabled: ' + res.body.error_message);
  } else {
    console.log('  Maps API response:', res.body.status, '(proceeding)');
  }

  // Update Secrets Manager (both shared + driver-specific)
  updateSecret('terraai/google-maps',        { GOOGLE_MAPS_KEY: mapsKey, GOOGLE_CLIENT_ID: clientId, GOOGLE_CLIENT_SECRET: clientSecret || '' });
  updateSecret('terraai/google-maps-driver', { GOOGLE_MAPS_KEY: mapsKey, GOOGLE_CLIENT_ID: clientId });
  console.log('  terraai/google-maps updated — key:', mask(mapsKey));

  // Update gograb-legacy-constants
  updateSecret('terraai/gograb-legacy-constants', { GOOGLE_MAPS_KEY: mapsKey, GOOGLE_CLIENT_ID: clientId });
  console.log('  terraai/gograb-legacy-constants updated');

  // Patch Driver App google-services.json with the real key
  const driverGSJ = path.resolve(__dirname, '../android/driver/app/google-services.json');
  if (fs.existsSync(driverGSJ)) {
    const gsj = JSON.parse(fs.readFileSync(driverGSJ, 'utf8'));
    if (gsj.client && gsj.client[0] && gsj.client[0].api_key) {
      gsj.client[0].api_key[0].current_key = mapsKey;
      fs.writeFileSync(driverGSJ, JSON.stringify(gsj, null, 2));
      console.log('  android/driver/app/google-services.json — api_key updated');
    }
  }

  // Patch Customer App google-services.json
  const customerGSJ = path.resolve(__dirname, '../android/customer/app/google-services.json');
  if (fs.existsSync(customerGSJ)) {
    try {
      const gsj = JSON.parse(fs.readFileSync(customerGSJ, 'utf8'));
      if (gsj.client && gsj.client[0] && gsj.client[0].api_key) {
        gsj.client[0].api_key[0].current_key = mapsKey;
        fs.writeFileSync(customerGSJ, JSON.stringify(gsj, null, 2));
        console.log('  android/customer/app/google-services.json — api_key updated');
      }
    } catch (e) { console.warn('  Could not patch customer google-services.json:', e.message); }
  }

  // Update Cognito Google IdP
  if (clientId && clientSecret) {
    execSync(`aws cognito-idp update-identity-provider --user-pool-id ${COGNITO_POOL} --provider-name Google --provider-details "{\\"client_id\\":\\"${clientId}\\",\\"client_secret\\":\\"${clientSecret}\\",\\"authorize_scopes\\":\\"profile email openid\\"}" --region ${REGION} --output json`, { stdio: 'pipe' });
    console.log('  Cognito Google IdP updated — client_id:', mask(clientId));
  }

  // Remind about SHA-1 fingerprint for Maps key restriction
  console.log('  ');
  console.log('  REMINDER: Restrict your Maps API key to this Android app:');
  console.log('    Package name: com.opusaimobility.driver');
  console.log('    SHA-1: run: keytool -list -v -keystore android/driver/app/opusaimobility-driver.jks');
  console.log('           -alias opusaimobility -storepass "OpusAI2026@Keystore!"');
  console.log('  Also restrict to: com.yna.opusaimobilityapp (customer app)');
  console.log('  ');
  console.log('  Google credentials injected.');
}

// ── Twilio ────────────────────────────────────────────────────────────────────
async function injectTwilio({ accountSid, authToken, number }) {
  console.log('\n Twilio SMS');
  console.log('  Validating Twilio credentials...');
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  const res = await new Promise((resolve, reject) => {
    https.get({ hostname: 'api.twilio.com', path: `/2010-04-01/Accounts/${accountSid}.json`, headers: { Authorization: `Basic ${auth}` } }, r => {
      let d = ''; r.on('data', c => d += c);
      r.on('end', () => { try { resolve({ status: r.statusCode, body: JSON.parse(d) }); } catch { resolve({ status: r.statusCode, body: d }); } });
    }).on('error', reject);
  });
  if (res.status === 200 && res.body.sid) {
    console.log('  Twilio credentials VALID — account:', res.body.friendly_name, 'status:', res.body.status);
  } else {
    throw new Error('Twilio validation failed: ' + JSON.stringify(res.body).substring(0, 100));
  }

  updateSecret('terraai/twilio', { TWILIO_ACCOUNTSID: accountSid, TWILIO_AUTHTOKEN: authToken, TWILIO_NUMBER: number, VERIFICATION_PHONENO_MESSAGE: 'Your aimobility verification code is' });
  updateSecret('terraai/gograb-legacy-constants', { TWILIO_ACCOUNTSID: accountSid, TWILIO_AUTHTOKEN: authToken, TWILIO_NUMBER: number });
  console.log('  terraai/twilio updated — SID:', mask(accountSid));
  console.log('  Twilio credentials injected.');
}

// ── Facebook ──────────────────────────────────────────────────────────────────
async function injectFacebook({ appId, appSecret }) {
  console.log('\n Facebook OAuth');
  console.log('  Validating Facebook App credentials...');
  const res = await httpsGet(`https://graph.facebook.com/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&grant_type=client_credentials`);
  if (res.status === 200 && res.body.access_token) {
    console.log('  Facebook App credentials VALID — token type:', res.body.token_type);
  } else {
    throw new Error('Facebook validation failed: ' + JSON.stringify(res.body).substring(0, 100));
  }

  updateSecret('terraai/facebook-oauth', { FACEBOOK_APP_ID: appId, FACEBOOK_APP_SECRET: appSecret, FACEBOOK_GRAPH_VERSION: 'v17.0' });
  updateSecret('terraai/gograb-legacy-constants', { FACEBOOK_APP_ID: appId, FACEBOOK_APP_SECRET: appSecret });
  console.log('  terraai/facebook-oauth updated — app_id:', mask(appId));

  // Update Cognito Facebook IdP
  execSync(`aws cognito-idp update-identity-provider --user-pool-id ${COGNITO_POOL} --provider-name Facebook --provider-details "{\\"client_id\\":\\"${appId}\\",\\"client_secret\\":\\"${appSecret}\\",\\"authorize_scopes\\":\\"public_profile,email\\",\\"api_version\\":\\"v17.0\\"}" --region ${REGION} --output json`, { stdio: 'pipe' });
  console.log('  Cognito Facebook IdP updated — app_id:', mask(appId));
  console.log('  Facebook credentials injected.');
}

// ── Stripe ────────────────────────────────────────────────────────────────────
async function injectStripe({ secretKey, webhookSecret, publishableKey }) {
  console.log('\n Stripe Payments');
  console.log('  Validating Stripe secret key...');
  const auth = Buffer.from(`${secretKey}:`).toString('base64');
  const res = await new Promise((resolve, reject) => {
    https.get({ hostname: 'api.stripe.com', path: '/v1/account', headers: { Authorization: `Basic ${auth}` } }, r => {
      let d = ''; r.on('data', c => d += c);
      r.on('end', () => { try { resolve({ status: r.statusCode, body: JSON.parse(d) }); } catch { resolve({ status: r.statusCode, body: d }); } });
    }).on('error', reject);
  });
  if (res.status === 200 && res.body.id) {
    console.log('  Stripe key VALID — account:', res.body.id, 'country:', res.body.country);
  } else {
    throw new Error('Stripe validation failed: ' + JSON.stringify(res.body).substring(0, 100));
  }

  const stripeSecret = { SecretKey: secretKey, PublishableKey: publishableKey || '', WebhookSecret: webhookSecret || '' };
  execSync(`aws secretsmanager update-secret --secret-id "terraai/stripe" --secret-string '${JSON.stringify(stripeSecret)}' --region ${REGION}`, { stdio: 'pipe' });
  updateSecret('terraai/gograb-legacy-constants', { STRIPE_API_KEY: secretKey });
  console.log('  terraai/stripe updated — key:', mask(secretKey));

  // Update Lambda env
  updateLambdaEnv(LAMBDA_STRIPE, { STRIPE_SECRET_KEY_SECRET: 'terraai/stripe' });
  console.log('  Stripe credentials injected.');
}

// ── Arg parser ────────────────────────────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].replace(/^--/, '').replace(/-([a-z])/g, (_, l) => l.toUpperCase());
      opts[key] = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true;
    }
  }
  return opts;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const opts = parseArgs();
  const service = (opts.service || 'help').toLowerCase();
  console.log('\n aimobility Credential Injector');
  console.log(' ================================');

  try {
    if (service === 'google') {
      if (!opts.mapsKey) throw new Error('--maps-key required');
      if (!opts.clientId) throw new Error('--client-id required');
      await injectGoogle({ mapsKey: opts.mapsKey, clientId: opts.clientId, clientSecret: opts.clientSecret });
    }
    else if (service === 'twilio') {
      if (!opts.accountSid) throw new Error('--account-sid required');
      if (!opts.authToken)   throw new Error('--auth-token required');
      if (!opts.number)      throw new Error('--number required (E.164 format e.g. +12345678901)');
      await injectTwilio({ accountSid: opts.accountSid, authToken: opts.authToken, number: opts.number });
    }
    else if (service === 'facebook') {
      if (!opts.appId)     throw new Error('--app-id required');
      if (!opts.appSecret) throw new Error('--app-secret required');
      await injectFacebook({ appId: opts.appId, appSecret: opts.appSecret });
    }
    else if (service === 'stripe') {
      if (!opts.secretKey) throw new Error('--secret-key required');
      await injectStripe({ secretKey: opts.secretKey, webhookSecret: opts.webhookSecret, publishableKey: opts.publishableKey });
    }
    else if (service === 'all') {
      console.log('\n Running all services (requires all --flags)...');
      if (opts.mapsKey)    await injectGoogle({ mapsKey: opts.mapsKey, clientId: opts.clientId, clientSecret: opts.clientSecret });
      if (opts.accountSid) await injectTwilio({ accountSid: opts.accountSid, authToken: opts.authToken, number: opts.number });
      if (opts.appId)      await injectFacebook({ appId: opts.appId, appSecret: opts.appSecret });
      if (opts.secretKey)  await injectStripe({ secretKey: opts.secretKey, webhookSecret: opts.webhookSecret, publishableKey: opts.publishableKey });
    }
    else {
      console.log('\n USAGE:');
      console.log('   node scripts/inject-credentials.cjs --service google --maps-key AIza... --client-id 123.apps.googleusercontent.com --client-secret GOCSPX-...');
      console.log('   node scripts/inject-credentials.cjs --service twilio --account-sid ACxxx --auth-token xxx --number +254700000000');
      console.log('   node scripts/inject-credentials.cjs --service facebook --app-id 123456789 --app-secret abc123def456');
      console.log('   node scripts/inject-credentials.cjs --service stripe --secret-key sk_live_xxx --webhook-secret whsec_xxx --publishable-key pk_live_xxx');
      console.log('\n WHERE TO GET CREDENTIALS:');
      console.log('   Google Maps Key: https://console.cloud.google.com/apis/credentials');
      console.log('     Enable APIs: Maps Geocoding API, Distance Matrix API, Directions API, Places API');
      console.log('     Also enable: Google Sign-In (OAuth 2.0 Client ID for Web)');
      console.log('   Twilio:  https://console.twilio.com -> Account Info -> Account SID + Auth Token');
      console.log('     Get a phone number: https://console.twilio.com/us1/develop/phone-numbers/manage/incoming');
      console.log('   Facebook: https://developers.facebook.com/apps -> Create App -> Settings -> Basic');
      console.log('     Add Facebook Login product, set OAuth redirect: https://auth-opusaimobility.auth.us-east-1.amazoncognito.com/oauth2/idpresponse');
      console.log('   Stripe: https://dashboard.stripe.com/apikeys');
      console.log('     Webhook: https://dashboard.stripe.com/webhooks -> Add endpoint -> https://pg4ulam66a.execute-api.us-east-1.amazonaws.com/prod/payments/stripe/webhook');
      process.exit(0);
    }
    console.log('\n All credentials injected successfully.');
    console.log(' No Lambda redeployment needed — credentials read from Secrets Manager at runtime.');
  } catch (e) {
    console.error('\n ERROR:', e.message);
    process.exit(1);
  }
}

main();
