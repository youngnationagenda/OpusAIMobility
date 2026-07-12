/**
 * auth.js — Cognito JWT verification for aimobility Lambda API
 */
const { CognitoJwtVerifier } = require('aws-jwt-verify');
const {
  CognitoIdentityProviderClient,
  AdminInitiateAuthCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminGetUserCommand,
  SignUpCommand,
  AdminConfirmSignUpCommand,
} = require('@aws-sdk/client-cognito-identity-provider');

const REGION = process.env.AWS_REGION || 'us-east-1';
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || 'us-east-1_LKa4ElQem'; // TERRA-001 unified
const CLIENT_ID = process.env.COGNITO_CLIENT_ID || '2am01r4fmsp0s08991ftgub887'; // TERRA-001 unified

const cognitoClient = new CognitoIdentityProviderClient({ region: REGION });

const verifier = CognitoJwtVerifier.create({
  userPoolId: USER_POOL_ID,
  tokenUse: 'id',
  clientId: CLIENT_ID,
});

const PUBLIC_ROUTES = new Set([
  // ── Auth (public — no JWT needed) ───
  'login', 'loginUser', 'signUp', 'registerUser', 'socialLogin',
  'forgotPassword', 'resetPassword', 'verifyPhoneNo', 'sendOtp', 'verifyOtp',
  'verifyEmail', 'verifyForgotPasswordCode', 'changePasswordForgot',
  'health', 'ping', '', '/',
  'getCountries', 'getCountry', 'showCountries',
  'refreshToken', 'logout',
  // ── REST path aliases (TERRA-003) ───
  'auth/signup', 'auth/signin', 'auth/login', 'auth/register',
  'auth/forgot-password', 'auth/reset-password', 'auth/verify-otp', 'auth/send-otp',
  'auth/refresh',
  // ── Mapped legacy actions (publicly accessible) ───
  'getRideTypes', 'showRideTypes', 'requestVehicle',
  'getServiceCharges', 'manageServiceFee',
  'estimateFare', 'getSavedAddresses', 'getHelp', 'getNearbyDrivers',
  'getRestaurants', 'getAllRestaurants', 'showRestaurants',
  'getGoodTypes', 'showGoodTypes',
  'getSettings', 'setting',
  'getDashboardStats', 'dashboardData',
  'editProfile', 'addUser', 'getUserProfile', 'getProfile',
  'placeFoodOrder', 'createFoodOrder',
  'placeParcelOrder', 'createParcelOrder',
  'requestRide', 'bookRide',
  'getPaymentMethods', 'topUpWallet',
  'getNotifications', 'showUserNotifications', 'sendMessageNotification',
]);

function getAuthHeader(event) {
  const h = event.headers || {};
  return h['authorization'] || h['Authorization'] || '';
}

async function verifyCognitoToken(event) {
  const authHeader = getAuthHeader(event);
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  try {
    const claims = await verifier.verify(token);
    return claims;
  } catch (e) {
    console.warn('[auth] JWT verification failed:', e.message);
    return null;
  }
}

function isPublicRoute(route) {
  return PUBLIC_ROUTES.has(route);
}

async function cognitoLogin(email, password) {
  const cmd = new AdminInitiateAuthCommand({
    UserPoolId: USER_POOL_ID,
    ClientId: CLIENT_ID,
    AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
    AuthParameters: { USERNAME: email, PASSWORD: password },
  });
  const res = await cognitoClient.send(cmd);
  return {
    idToken: res.AuthenticationResult.IdToken,
    accessToken: res.AuthenticationResult.AccessToken,
    refreshToken: res.AuthenticationResult.RefreshToken,
    expiresIn: res.AuthenticationResult.ExpiresIn,
  };
}

async function cognitoRefresh(refreshToken) {
  const cmd = new AdminInitiateAuthCommand({
    UserPoolId: USER_POOL_ID,
    ClientId: CLIENT_ID,
    AuthFlow: 'REFRESH_TOKEN_AUTH',
    AuthParameters: { REFRESH_TOKEN: refreshToken },
  });
  const res = await cognitoClient.send(cmd);
  return {
    idToken: res.AuthenticationResult.IdToken,
    accessToken: res.AuthenticationResult.AccessToken,
    expiresIn: res.AuthenticationResult.ExpiresIn,
  };
}

async function cognitoCreateUser(email, password, attributes) {
  try {
    await cognitoClient.send(new SignUpCommand({
      ClientId: CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: 'email', Value: email },
        ...(attributes.given_name ? [{ Name: 'given_name', Value: attributes.given_name }] : []),
        ...(attributes.family_name ? [{ Name: 'family_name', Value: attributes.family_name }] : []),
        ...(attributes.phone_number ? [{ Name: 'phone_number', Value: attributes.phone_number }] : []),
      ],
    }));
    await cognitoClient.send(new AdminConfirmSignUpCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
    }));
  } catch (e) {
    if (e.name === 'UsernameExistsException') return;
    throw e;
  }
}

async function cognitoUserExists(email) {
  try {
    await cognitoClient.send(new AdminGetUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
    }));
    return true;
  } catch (e) {
    if (e.name === 'UserNotFoundException') return false;
    throw e;
  }
}

async function cognitoMigrateUser(email, password) {
  try {
    await cognitoClient.send(new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      UserAttributes: [{ Name: 'email', Value: email }, { Name: 'email_verified', Value: 'true' }],
      MessageAction: 'SUPPRESS',
    }));
    await cognitoClient.send(new AdminSetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      Password: password,
      Permanent: true,
    }));
  } catch (e) {
    if (e.name === 'UsernameExistsException') return;
    throw e;
  }
}

module.exports = {
  verifyCognitoToken,
  isPublicRoute,
  cognitoLogin,
  cognitoRefresh,
  cognitoCreateUser,
  cognitoUserExists,
  cognitoMigrateUser,
  PUBLIC_ROUTES,
};
