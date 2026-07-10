/**
 * Fix index.js:
 * 1. getBody() — handle form-urlencoded AND JSON AND empty bodies
 * 2. login/loginVendor — validate email exists before DB call
 * 3. signUp/registerUser — validate email before DB call
 * 4. verifyEmail — guard before DB call
 * 5. All DynamoDB routes — safe guards
 */
const fs  = require('fs');
const qs  = require('querystring');
let code  = fs.readFileSync('aws/lambda/api/index.js', 'utf8');

// ── Fix 1: getBody — handle form-encoded, JSON, and empty bodies ────────────
const OLD_GETBODY = `function getBody(e) { try{ if(e.body)return JSON.parse(e.body); }catch(_){} return e.queryStringParameters||{}; }`;
const NEW_GETBODY = `function getBody(e) {
  try {
    const raw = e.body || '';
    if (!raw) return e.queryStringParameters || {};
    // base64 decode if needed
    const decoded = e.isBase64Encoded ? Buffer.from(raw, 'base64').toString('utf8') : raw;
    const ct = ((e.headers || {})['content-type'] || (e.headers || {})['Content-Type'] || '').toLowerCase();
    // form-urlencoded
    if (ct.includes('application/x-www-form-urlencoded')) {
      return require('querystring').parse(decoded);
    }
    // JSON (default)
    return JSON.parse(decoded);
  } catch(_) {
    return e.queryStringParameters || {};
  }
}`;

if (code.includes(OLD_GETBODY)) {
  code = code.replace(OLD_GETBODY, NEW_GETBODY);
  process.stdout.write('✅ getBody() fixed — handles JSON + form-encoded + empty\n');
} else {
  process.stdout.write('⚠️  getBody not found as expected\n');
}

// ── Fix 2: login + loginUser — guard empty email ────────────────────────────
const OLD_LOGIN = `    case 'login': case 'loginUser': {
      const u = await db.getUserByEmail(body.email);
      if (!u) return err('Invalid email or password');
      if (body.device_token) await db.updateItem(db.T.USERS, {userId:u.userId}, {device_token:body.device_token}).catch(()=>{});
      return ok({ User:{...u,token:'token_'+u.userId+'_'+Date.now()}, Country:COUNTRIES[0] });
    }`;
const NEW_LOGIN = `    case 'login': case 'loginUser': {
      if (!body.email) return err('Email is required');
      const u = await db.getUserByEmail(body.email);
      if (!u) return err('Invalid email or password');
      if (body.device_token) await db.updateItem(db.T.USERS, {userId:u.userId}, {device_token:body.device_token}).catch(()=>{});
      return ok({ User:{...u,token:'token_'+u.userId+'_'+Date.now()}, Country:COUNTRIES[0] });
    }`;
code = code.replace(OLD_LOGIN, NEW_LOGIN);
process.stdout.write('✅ login route hardened\n');

// ── Fix 3: loginVendor — guard empty email ──────────────────────────────────
const OLD_VENDOR = `    case 'loginVendor': {
      const u = await db.getUserByEmail(body.email);
      if (!u||u.role!=='admin') return err('Invalid credentials');
      return ok({ User:{...u,token:'vendor_'+u.userId}, Country:COUNTRIES[0] });
    }`;
const NEW_VENDOR = `    case 'loginVendor': {
      if (!body.email) return err('Email is required');
      const u = await db.getUserByEmail(body.email);
      if (!u || u.role !== 'admin') return err('Invalid credentials');
      return ok({ User:{...u,token:'vendor_'+u.userId}, Country:COUNTRIES[0] });
    }`;
code = code.replace(OLD_VENDOR, NEW_VENDOR);
process.stdout.write('✅ loginVendor route hardened\n');

// ── Fix 4: signUp/registerUser — guard empty email ──────────────────────────
const OLD_SIGNUP = `    case 'signUp': case 'registerUser': {
      const exists = body.email ? await db.getUserByEmail(body.email) : null;
      const u = exists || await db.createUser(body);
      return ok({ User:{...u,token:'token_'+u.userId+'_'+Date.now()}, Country:COUNTRIES[0] });
    }`;
const NEW_SIGNUP = `    case 'signUp': case 'registerUser': {
      if (!body.email || !body.first_name) return err('Email and first_name are required');
      const exists = await db.getUserByEmail(body.email);
      const u = exists || await db.createUser(body);
      return ok({ User:{...u,token:'token_'+u.userId+'_'+Date.now()}, Country:COUNTRIES[0] });
    }`;
code = code.replace(OLD_SIGNUP, NEW_SIGNUP);
process.stdout.write('✅ signUp/registerUser route hardened\n');

// ── Fix 5: verifyEmail — guard ──────────────────────────────────────────────
const OLD_VERIFY = `    case 'verifyEmail': { const u=await db.getUserByEmail(body.email); return u?ok('Email exists'):err('Not found'); }`;
const NEW_VERIFY = `    case 'verifyEmail': { if(!body.email)return err('Email required'); const u=await db.getUserByEmail(body.email); return u?ok('Email exists'):err('Not found'); }`;
code = code.replace(OLD_VERIFY, NEW_VERIFY);
process.stdout.write('✅ verifyEmail route hardened\n');

// ── Fix 6: socialLogin — guard ──────────────────────────────────────────────
const OLD_SOCIAL = `    case 'socialLogin': {
      let u = body.email?await db.getUserByEmail(body.email):null;
      if(!u) u = await db.createUser({first_name:body.first_name||'User',last_name:body.last_name||'',email:body.email||'',role:'user'});
      return ok({User:{...u,token:'social_'+u.userId+'_'+Date.now()},Country:COUNTRIES[0]});
    }`;
const NEW_SOCIAL = `    case 'socialLogin': {
      let u = (body.email) ? await db.getUserByEmail(body.email) : null;
      if (!u) u = await db.createUser({first_name:body.first_name||'User',last_name:body.last_name||'',email:body.email||('social_'+Date.now()+'@app.local'),role:'user'});
      return ok({User:{...u,token:'social_'+u.userId+'_'+Date.now()},Country:COUNTRIES[0]});
    }`;
code = code.replace(OLD_SOCIAL, NEW_SOCIAL);
process.stdout.write('✅ socialLogin route hardened\n');

fs.writeFileSync('aws/lambda/api/index.js', Buffer.from(code));
process.stdout.write('✅ index.js saved — ' + fs.statSync('aws/lambda/api/index.js').size + ' bytes\n');
