/**
 * Upgrade admin panel Lambda:
 *  1. Replace in-memory sessions with DynamoDB sessions
 *  2. Update API_BASE to use custom domain api.yna.co.ke
 *  3. Add session TTL (12h auto-expiry via DynamoDB TTL)
 */
const fs = require('fs');
let code = fs.readFileSync('aws/admin-panel/index.js', 'utf8');

// 1. Update API_BASE to custom domain
code = code.replace(
  'const API_BASE="https://pg4ulam66a.execute-api.us-east-1.amazonaws.com/prod/api/";',
  'const API_BASE="https://api.yna.co.ke/api/";'
);
process.stdout.write('✅ Updated API_BASE to api.yna.co.ke\n');

// 2. Replace in-memory session block with DynamoDB sessions
const OLD_SESSIONS = `const sessions={};
function sid(){return Math.random().toString(36).slice(2)+Date.now().toString(36);}
function getSession(c){var m=(c||'').split(';').map(function(x){return x.trim();}).find(function(x){return x.indexOf('sid=')===0;});return m?sessions[m.slice(4)]||null:null;}
function setCookie(id){return 'sid='+id+'; Path=/; HttpOnly; SameSite=Lax';}`;

const NEW_SESSIONS = `// ─── DynamoDB Session Store (persistent, multi-instance) ────────────────────
const { DynamoDBClient }=require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient,GetCommand,PutCommand,DeleteCommand }=require('@aws-sdk/lib-dynamodb');
const _ddbClient=new DynamoDBClient({region:process.env.AWS_REGION||'us-east-1'});
const _ddb=DynamoDBDocumentClient.from(_ddbClient);
const SESSION_TABLE='aimobility-sessions';
const SESSION_TTL_HOURS=12;

function sid(){return Math.random().toString(36).slice(2)+Date.now().toString(36)+Math.random().toString(36).slice(2);}

async function getSession(cookie){
  try{
    var m=(cookie||'').split(';').map(function(x){return x.trim();}).find(function(x){return x.indexOf('sid=')===0;});
    if(!m)return null;
    var sessionId=m.slice(4);
    if(!sessionId)return null;
    var r=await _ddb.send(new GetCommand({TableName:SESSION_TABLE,Key:{sessionId:sessionId}}));
    var item=r.Item;
    if(!item)return null;
    // Check TTL manually (belt-and-suspenders)
    if(item.ttl && item.ttl < Math.floor(Date.now()/1000))return null;
    return item.data||null;
  }catch(e){
    console.error('[Session] getSession error:',e.message);
    return null;
  }
}

async function saveSession(sessionId,data){
  try{
    var ttl=Math.floor(Date.now()/1000)+(SESSION_TTL_HOURS*3600);
    await _ddb.send(new PutCommand({
      TableName:SESSION_TABLE,
      Item:{sessionId:sessionId,data:data,ttl:ttl,created:new Date().toISOString()}
    }));
  }catch(e){
    console.error('[Session] saveSession error:',e.message);
  }
}

async function deleteSession(cookie){
  try{
    var m=(cookie||'').split(';').map(function(x){return x.trim();}).find(function(x){return x.indexOf('sid=')===0;});
    if(!m)return;
    var sessionId=m.slice(4);
    await _ddb.send(new DeleteCommand({TableName:SESSION_TABLE,Key:{sessionId:sessionId}}));
  }catch(e){
    console.error('[Session] deleteSession error:',e.message);
  }
}

function setCookie(id){return 'sid='+id+'; Path=/; HttpOnly; SameSite=Lax; Max-Age='+SESSION_TTL_HOURS*3600;}`;

if (code.includes(OLD_SESSIONS)) {
  code = code.replace(OLD_SESSIONS, NEW_SESSIONS);
  process.stdout.write('✅ Replaced in-memory sessions with DynamoDB sessions\n');
} else {
  process.stdout.write('⚠️  Could not find exact session block - applying targeted patches\n');
  // Targeted patches
  code = code.replace(
    "const sessions={};",
    NEW_SESSIONS
  );
}

// 3. Fix logout to use async deleteSession
code = code.replace(
  `if(query.action==="logout"){
    if(sess){var sk=cookie.split(";").map(function(c){return c.trim();}).find(function(c){return c.indexOf("sid=")===0;});if(sk)delete sessions[sk.slice(4)];}
    return redir("?","sid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT");
  }`,
  `if(query.action==="logout"){
    await deleteSession(cookie);
    return redir("?","sid=; Path=/; HttpOnly; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0");
  }`
);
process.stdout.write('✅ Updated logout to use DynamoDB deleteSession\n');

// 4. Fix login to use saveSession instead of sessions[id]=...
code = code.replace(
  `sessions[id]={userId:u.userId||u.id,first_name:u.first_name||"Admin",last_name:u.last_name||"",email:u.email||"",role:u.role||"admin"};`,
  `await saveSession(id,{userId:u.userId||u.id,first_name:u.first_name||"Admin",last_name:u.last_name||"",email:u.email||"",role:u.role||"admin"});`
);
process.stdout.write('✅ Updated login to use DynamoDB saveSession\n');

// 5. Make handler async-compatible for DynamoDB session reads
// getSession is now async - update all usage points
code = code.replace(
  "var sess=getSession(cookie);",
  "var sess=await getSession(cookie);"
);
process.stdout.write('✅ Updated getSession to await\n');

// 6. Update CSS with custom domain notice
code = code.replace(
  "CSS+='.notice-err{background:#fff5f5;border-color:#fecaca;color:#7f1d1d}';",
  "CSS+='.notice-err{background:#fff5f5;border-color:#fecaca;color:#7f1d1d}';\nCSS+='.domain-badge{background:#084c3f;color:#fff;font-size:11px;padding:2px 8px;border-radius:100px;font-family:monospace}';"
);

fs.writeFileSync('aws/admin-panel/index.js', Buffer.from(code));
process.stdout.write('✅ Saved upgraded index.js\n');
process.stdout.write('📦 Size: ' + fs.statSync('aws/admin-panel/index.js').size + ' bytes\n');
