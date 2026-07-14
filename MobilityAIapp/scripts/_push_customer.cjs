'use strict';
/**
 * _push_customer.cjs — Pushes all customer app fixed files to GitHub
 * Run: node scripts/_push_customer.cjs
 */
const https = require('https');
const fs    = require('fs');
const path  = require('path');

const PAT    = 'process.env.GITHUB_TOKEN';
const OWNER  = 'youngnationagenda';
const REPO   = 'OpusAIMobility';
const BRANCH = 'main';
const MSG    = 'fix(customer-android): configure AWS resources, fix Constants, google-services, gradlew LF';

function ghGet(p) {
  return new Promise((res,rej) => {
    https.get({ hostname:'api.github.com', path:p,
      headers:{'Authorization':'token '+PAT,'User-Agent':'x','Accept':'application/vnd.github.v3+json'}
    }, r => { let d=''; r.on('data',c=>d+=c); r.on('end',()=>{ try{res({s:r.statusCode,b:JSON.parse(d)});}catch{res({s:r.statusCode,b:d});} }); }).on('error',rej);
  });
}

function ghPut(p, body) {
  return new Promise((res,rej) => {
    const d=JSON.stringify(body);
    const req=https.request({ hostname:'api.github.com', path:p, method:'PUT',
      headers:{'Authorization':'token '+PAT,'User-Agent':'x','Content-Type':'application/json','Accept':'application/vnd.github.v3+json','Content-Length':Buffer.byteLength(d)}
    }, r => { let dd=''; r.on('data',c=>dd+=c); r.on('end',()=>{ try{res({s:r.statusCode,b:JSON.parse(dd)});}catch{res({s:r.statusCode,b:dd});} }); });
    req.on('error',rej); req.write(d); req.end();
  });
}

async function pushFile(local, remote) {
  if (!fs.existsSync(local)) { console.log('  SKIP (not found):', local); return; }
  const content = fs.readFileSync(local);
  const b64 = content.toString('base64');
  const shaRes = await ghGet('/repos/'+OWNER+'/'+REPO+'/contents/'+remote+'?ref='+BRANCH);
  const sha = shaRes.s === 200 ? shaRes.b.sha : null;
  const body = { message: MSG, content: b64, branch: BRANCH };
  if (sha) body.sha = sha;
  const r = await ghPut('/repos/'+OWNER+'/'+REPO+'/contents/'+remote, body);
  const ok = r.s === 200 || r.s === 201;
  console.log(ok ? '  OK' : '  FAIL', path.basename(local), r.s, content.length+'B');
  await new Promise(res => setTimeout(res, 350));
}

async function main() {
  console.log('\n Pushing Customer App fixed files to GitHub...\n');
  const APP='MobilityAIapp';
  const files = [
    // Buildspecs
    ['buildspec-android-customer.yml',              `${APP}/buildspec-android-customer.yml`],
    ['buildspec.yml',                               `${APP}/buildspec.yml`],

    // Customer app key files
    ['android/customer/gradlew',                    `${APP}/android/customer/gradlew`],
    ['android/customer/build.gradle',               `${APP}/android/customer/build.gradle`],
    ['android/customer/settings.gradle',            `${APP}/android/customer/settings.gradle`],
    ['android/customer/gradle.properties',          `${APP}/android/customer/gradle.properties`],
    ['android/customer/gradle/wrapper/gradle-wrapper.properties', `${APP}/android/customer/gradle/wrapper/gradle-wrapper.properties`],
    ['android/customer/local.properties',           `${APP}/android/customer/local.properties`],
    ['android/customer/SECRETS_SETUP.md',           `${APP}/android/customer/SECRETS_SETUP.md`],

    // App module
    ['android/customer/app/build.gradle',           `${APP}/android/customer/app/build.gradle`],
    ['android/customer/app/google-services.json',   `${APP}/android/customer/app/google-services.json`],
    ['android/customer/app/proguard-rules.pro',     `${APP}/android/customer/app/proguard-rules.pro`],
    ['android/customer/app/src/main/AndroidManifest.xml', `${APP}/android/customer/app/src/main/AndroidManifest.xml`],

    // Constants (both namespaces)
    ['android/customer/app/src/main/java/com/yna/opusaimobilityapp/Constants.java',  `${APP}/android/customer/app/src/main/java/com/yna/opusaimobilityapp/Constants.java`],
    ['android/customer/app/src/main/java/com/terraai/aimobility/Constants.java',     `${APP}/android/customer/app/src/main/java/com/terraai/aimobility/Constants.java`],

    // Scripts
    ['scripts/inject-credentials.cjs',              `${APP}/scripts/inject-credentials.cjs`],

    // Custom attrs fix for pageindicator
    ['android/customer/app/src/main/res/values/pageindicator_attrs.xml',
     `${APP}/android/customer/app/src/main/res/values/pageindicator_attrs.xml`],
  ];

  let ok=0, fail=0;
  for (const [local, remote] of files) {
    try { await pushFile(local, remote); ok++; }
    catch(e) { console.error('  ERR:', local, e.message); fail++; }
  }
  console.log('\n Done:', ok, 'OK,', fail, 'failed');
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
