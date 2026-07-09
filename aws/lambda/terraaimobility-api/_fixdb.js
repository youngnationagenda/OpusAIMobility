/**
 * Fix db.js — guard getUserByEmail and getUserByPhone against
 * empty/undefined/null values which cause DynamoDB 500 errors
 */
const fs = require('fs');
let code = fs.readFileSync('aws/lambda/api/db.js', 'utf8');

// Fix getUserByEmail — return null immediately if email is falsy
const OLD_GET_EMAIL = `async function getUserByEmail(email) {
  const res = await ddb.send(new ScanCommand({
    TableName: T.USERS,
    FilterExpression: "email = :e",
    ExpressionAttributeValues: { ":e": email },
    Limit: 1,
  }));
  return (res.Items || [])[0] || null;
}`;

const NEW_GET_EMAIL = `async function getUserByEmail(email) {
  if (!email || typeof email !== 'string' || !email.trim()) return null;
  const res = await ddb.send(new ScanCommand({
    TableName: T.USERS,
    FilterExpression: 'email = :e',
    ExpressionAttributeValues: { ':e': email.trim().toLowerCase() },
    Limit: 1,
  }));
  return (res.Items || [])[0] || null;
}`;

if (code.includes(OLD_GET_EMAIL)) {
  code = code.replace(OLD_GET_EMAIL, NEW_GET_EMAIL);
  process.stdout.write('✅ getUserByEmail hardened\n');
} else {
  process.stdout.write('⚠️  getUserByEmail not found — applying regex patch\n');
  code = code.replace(
    /async function getUserByEmail\(email\) \{[\s\S]*?return \(res\.Items \|\| \[\]\)\[0\] \|\| null;\s*\}/,
    NEW_GET_EMAIL
  );
  process.stdout.write('✅ getUserByEmail patched via regex\n');
}

// Fix getUserByPhone too
const OLD_GET_PHONE = `async function getUserByPhone(phone) {
  const res = await ddb.send(new ScanCommand({
    TableName: T.USERS,
    FilterExpression: "phone = :p",
    ExpressionAttributeValues: { ":p": phone },
    Limit: 1,
  }));
  return (res.Items || [])[0] || null;
}`;

const NEW_GET_PHONE = `async function getUserByPhone(phone) {
  if (!phone || typeof phone !== 'string' || !phone.trim()) return null;
  const res = await ddb.send(new ScanCommand({
    TableName: T.USERS,
    FilterExpression: 'phone = :p',
    ExpressionAttributeValues: { ':p': phone.trim() },
    Limit: 1,
  }));
  return (res.Items || [])[0] || null;
}`;

if (code.includes(OLD_GET_PHONE)) {
  code = code.replace(OLD_GET_PHONE, NEW_GET_PHONE);
  process.stdout.write('✅ getUserByPhone hardened\n');
}

fs.writeFileSync('aws/lambda/api/db.js', Buffer.from(code));
process.stdout.write('✅ db.js saved — ' + fs.statSync('aws/lambda/api/db.js').size + ' bytes\n');
