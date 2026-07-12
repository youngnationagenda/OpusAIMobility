/**
 * Patches CloudFront distribution E18GJ5VKHBIJAI to add SPA custom error responses:
 *   403 -> /index.html (200)
 *   404 -> /index.html (200)
 * This fixes React Router deep-links and page refreshes returning blank pages.
 */
const { execSync } = require('child_process');

const DIST_ID = 'E18GJ5VKHBIJAI';
const REGION  = 'us-east-1';

function aws(cmd) {
  return JSON.parse(execSync(`aws ${cmd} --region ${REGION} --output json`, { encoding: 'utf8' }));
}

console.log('Fetching current distribution config...');
const res    = aws(`cloudfront get-distribution-config --id ${DIST_ID}`);
const etag   = res.ETag;
const config = res.DistributionConfig;

// Fix S3OriginConfig — remove stale OriginReadTimeout (not valid for OAC S3 origins)
config.Origins.Items = config.Origins.Items.map(o => {
  if (o.S3OriginConfig) {
    delete o.S3OriginConfig.OriginReadTimeout;
  }
  return o;
});

// Inject custom error responses for SPA routing
config.CustomErrorResponses = {
  Quantity: 2,
  Items: [
    {
      ErrorCode: 403,
      ResponsePagePath: '/index.html',
      ResponseCode: '200',
      ErrorCachingMinTTL: 0
    },
    {
      ErrorCode: 404,
      ResponsePagePath: '/index.html',
      ResponseCode: '200',
      ErrorCachingMinTTL: 0
    }
  ]
};

const body = JSON.stringify(config);
require('fs').writeFileSync('aws/cf-config-patch.json', body);

console.log('Applying patch (403→index.html, 404→index.html)...');
const update = JSON.parse(
  execSync(
    `aws cloudfront update-distribution --id ${DIST_ID} --distribution-config file://aws/cf-config-patch.json --if-match ${etag} --region ${REGION} --output json`,
    { encoding: 'utf8' }
  )
);

console.log('Status:', update.Distribution.Status);
console.log('ETag:  ', update.ETag);
console.log('Done. CloudFront will deploy in ~2 min.');
