'use strict';
/**
 * Attach WAF ACL to API Gateway HTTP API stage ($default)
 * and then verify + report status.
 */
const { WAFV2Client, AssociateWebACLCommand, GetWebACLForResourceCommand, ListResourcesForWebACLCommand } = require('@aws-sdk/client-wafv2');

const REGION   = 'us-east-1';
const WAF_ARN  = 'arn:aws:wafv2:us-east-1:683541453923:regional/webacl/terraai-api-waf/ecdad4e0-d66d-4656-9d70-6096b72f5f8d';
// HTTP API v2 WAF resource ARN format (account ID required, no double colon after region)
const API_STAGE_ARN = 'arn:aws:apigateway:us-east-1:683541453923::/apis/0wv2nyk3je/stages/$default';

const waf = new WAFV2Client({ region: REGION });

async function run() {
  console.log('\n🛡️  Attaching WAF to API Gateway HTTP API\n');
  console.log('WAF ARN:  ', WAF_ARN);
  console.log('API ARN:  ', API_STAGE_ARN, '\n');

  // Try multiple ARN formats until one works
  const arnFormats = [
    'arn:aws:apigateway:us-east-1:683541453923::/apis/0wv2nyk3je/stages/$default',
    'arn:aws:apigateway:us-east-1:683541453923:/apis/0wv2nyk3je/stages/$default',
    'arn:aws:execute-api:us-east-1:683541453923:0wv2nyk3je/$default',
    'arn:aws:apigateway:us-east-1::0wv2nyk3je/$default',
  ];

  for (const arn of arnFormats) {
    try {
      console.log(`Trying ARN: ${arn}`);
      await waf.send(new AssociateWebACLCommand({
        WebACLArn:   WAF_ARN,
        ResourceArn: arn,
      }));
      console.log(`✅ SUCCESS with ARN: ${arn}`);
      break;
    } catch (e) {
      console.log(`  ❌ ${e.name}: ${e.message.slice(0, 120)}`);
    }
  }

  // Verify
  console.log('\n📋 Current WAF associations:');
  const res = await waf.send(new ListResourcesForWebACLCommand({ WebACLArn: WAF_ARN }));
  if (res.ResourceArns && res.ResourceArns.length > 0) {
    res.ResourceArns.forEach(a => console.log('  ✅ Protected:', a));
  } else {
    console.log('  ⚠️  No resources associated — WAF still not attached');
  }
}

run().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
