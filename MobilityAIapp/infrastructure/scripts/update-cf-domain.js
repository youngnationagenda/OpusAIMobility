'use strict';
/**
 * Add opusaimobility.yna.co.ke custom domain to CloudFront E18GJ5VKHBIJAI
 * and wire the ACM certificate.
 */
const { CloudFrontClient, GetDistributionConfigCommand, UpdateDistributionCommand } = require('@aws-sdk/client-cloudfront');

const DIST_ID    = 'E18GJ5VKHBIJAI';
const CERT_ARN   = 'arn:aws:acm:us-east-1:683541453923:certificate/704d96b8-1017-485c-ba24-476370d42a63';
const DOMAIN     = 'opusaimobility.yna.co.ke';
const cf = new CloudFrontClient({ region: 'us-east-1' });

async function run() {
  // Get current config + ETag
  const { DistributionConfig: cfg, ETag } = await cf.send(new GetDistributionConfigCommand({ Id: DIST_ID }));

  // Add custom domain alias
  cfg.Aliases = { Quantity: 1, Items: [DOMAIN] };

  // Wire ACM certificate (requires SNI)
  cfg.ViewerCertificate = {
    ACMCertificateArn:      CERT_ARN,
    SSLSupportMethod:       'sni-only',
    MinimumProtocolVersion: 'TLSv1.2_2021',
    Certificate:            CERT_ARN,
    CertificateSource:      'acm',
  };

  const res = await cf.send(new UpdateDistributionCommand({
    Id:                 DIST_ID,
    IfMatch:            ETag,
    DistributionConfig: cfg,
  }));

  console.log('✅ CloudFront updated!');
  console.log('   Distribution:', DIST_ID);
  console.log('   Domain:      ', DOMAIN);
  console.log('   Status:      ', res.Distribution.Status);
  console.log('   ACM cert:    ', CERT_ARN.slice(-40));
  console.log('\n⏳ ACM certificate pending DNS validation.');
  console.log('   DNS CNAME already added to Route53.');
  console.log('   Validation usually completes in 2-5 minutes.');
  console.log('\n🌐 Final URL: https://' + DOMAIN);
}

run().catch(e => { console.error('Failed:', e.message); process.exit(1); });
