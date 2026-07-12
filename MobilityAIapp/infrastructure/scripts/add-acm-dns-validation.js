'use strict';
// Add ACM DNS validation CNAME + opusaimobility.yna.co.ke CNAME → CloudFront
const { Route53Client, ChangeResourceRecordSetsCommand } = require('@aws-sdk/client-route-53');

const HOSTED_ZONE_ID  = 'Z045519727P6F7DS3M5GC';
const CF_DOMAIN       = 'd22up4o3zhu9gf.cloudfront.net';
const r53 = new Route53Client({ region: 'us-east-1' });

async function run() {
  const res = await r53.send(new ChangeResourceRecordSetsCommand({
    HostedZoneId: HOSTED_ZONE_ID,
    ChangeBatch: {
      Comment: 'opusaimobility.yna.co.ke → CloudFront + ACM validation',
      Changes: [
        // ACM DNS validation CNAME
        {
          Action: 'UPSERT',
          ResourceRecordSet: {
            Name:            '_cd0b081a84bcc4648ff8379a6a4ffa72.opusaimobility.yna.co.ke.',
            Type:            'CNAME',
            TTL:             300,
            ResourceRecords: [{ Value: '_42cf175fae49cd4885d4b43deab47e2d.jkddzztszm.acm-validations.aws.' }],
          },
        },
        // Custom domain → CloudFront distribution
        {
          Action: 'UPSERT',
          ResourceRecordSet: {
            Name:            'opusaimobility.yna.co.ke.',
            Type:            'CNAME',
            TTL:             300,
            ResourceRecords: [{ Value: CF_DOMAIN }],
          },
        },
      ],
    },
  }));
  console.log('✅ Route53 records upserted:', res.ChangeInfo.Status);
  console.log('   Change ID:', res.ChangeInfo.Id);
  console.log('   ACM validation CNAME added');
  console.log('   opusaimobility.yna.co.ke →', CF_DOMAIN);
}

run().catch(e => { console.error('Failed:', e.message); process.exit(1); });
