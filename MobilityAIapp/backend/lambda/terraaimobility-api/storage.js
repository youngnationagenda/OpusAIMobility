/**
 * storage.js — S3 file upload helpers for aimobility
 *
 * Replaces GoGrab's PHP file upload functions from:
 *   php-api/mobileapp_api/app/Lib/Utility.php
 *
 * Functions migrated:
 *  - uploadFileintoFolder()        → generateUploadUrl() (pre-signed PUT)
 *  - uploadFileintoFolderDir()     → generateUploadUrl()
 *  - uploadMapImageintoFolder()    → storeImageFromUrl()
 *  - compressImage()               → handled client-side or via Lambda@Edge
 *  - unlinkFile()                  → deleteAsset()
 *
 * Upload flow:
 *  1. Client calls POST /api/uploadAsset → gets pre-signed S3 URL
 *  2. Client PUTs file directly to S3 (no Lambda data transfer)
 *  3. Client saves returned S3 key/URL in their profile/record
 *
 * S3 Bucket: opusaimobility-assets-prod
 * Folder structure mirrors GoGrab's UPLOADS_FOLDER_URI pattern:
 *   uploads/category/{id}/{uuid}.{ext}
 *   uploads/store/{id}/{uuid}.{ext}
 *   uploads/users/{id}/{uuid}.{ext}
 *   uploads/products/{id}/{uuid}.{ext}
 *   uploads/restaurants/{id}/{uuid}.{ext}
 *   uploads/sliders/{uuid}.{ext}
 *   tmp/{uuid}.{ext}  (auto-expires in 1 day via lifecycle)
 */

const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { randomUUID } = require('crypto');
const https = require('https');

const REGION      = process.env.AWS_REGION || 'us-east-1';
const BUCKET      = process.env.ASSETS_BUCKET || 'opusaimobility-assets-prod';
const CDN_BASE    = process.env.CDN_BASE_URL  || `https://${BUCKET}.s3.${REGION}.amazonaws.com`;
const URL_EXPIRY  = 300; // seconds — 5 minutes for pre-signed URLs

const s3 = new S3Client({ region: REGION });

/**
 * Valid upload folder types — maps GoGrab's UPLOADS_FOLDER_* constants
 */
const FOLDER_MAP = {
  category:   'uploads/category',
  store:      'uploads/store',
  user:       'uploads/users',
  product:    'uploads/products',
  restaurant: 'uploads/restaurants',
  slider:     'uploads/sliders',
  vehicle:    'uploads/vehicles',
  document:   'uploads/documents',
  logo:       'uploads/logos',
  cover:      'uploads/covers',
  tmp:        'tmp',
};

const ALLOWED_TYPES = {
  'image/jpeg':  'jpg',
  'image/jpg':   'jpg',
  'image/png':   'png',
  'image/gif':   'gif',
  'image/webp':  'webp',
  'application/pdf': 'pdf',
};

/**
 * Generate a pre-signed S3 PUT URL for direct browser/app upload.
 * Replaces Utility::uploadFileintoFolder() — but moves the upload to client-side
 * to avoid passing large binary payloads through Lambda.
 *
 * @param {object} opts
 * @param {string} opts.folder     - e.g. 'category', 'store', 'user'
 * @param {string} [opts.entityId] - ID of the owning entity (user_id, store_id etc)
 * @param {string} [opts.mimeType] - e.g. 'image/jpeg'
 * @param {string} [opts.fileName] - original filename (used for extension fallback)
 * @returns {Promise<{uploadUrl, key, publicUrl, expiresIn}>}
 */
async function generateUploadUrl({ folder = 'tmp', entityId = '0', mimeType = 'image/jpeg', fileName = '' } = {}) {
  const baseFolder = FOLDER_MAP[folder] || FOLDER_MAP.tmp;
  const ext = ALLOWED_TYPES[mimeType] || getExtFromFilename(fileName) || 'jpg';
  const key = entityId && entityId !== '0'
    ? `${baseFolder}/${entityId}/${randomUUID()}.${ext}`
    : `${baseFolder}/${randomUUID()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         key,
    ContentType: mimeType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: URL_EXPIRY });
  const publicUrl = `${CDN_BASE}/${key}`;

  return { uploadUrl, key, publicUrl, expiresIn: URL_EXPIRY, bucket: BUCKET };
}

/**
 * Generate a pre-signed GET URL for a private asset.
 * Used for secure document access (driver documents, user KYC).
 */
async function generateDownloadUrl(key, expiresIn = 900) {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3, command, { expiresIn });
}

/**
 * Delete an asset from S3.
 * Replaces Utility::unlinkFile() / @unlink() calls throughout AdminController.
 *
 * @param {string} keyOrUrl - S3 key or full S3 URL
 */
async function deleteAsset(keyOrUrl) {
  if (!keyOrUrl) return { deleted: false, reason: 'empty key' };
  const key = urlToKey(keyOrUrl);
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
    return { deleted: true, key };
  } catch (e) {
    console.warn('[storage] deleteAsset failed:', e.message);
    return { deleted: false, reason: e.message };
  }
}

/**
 * Check if an asset exists in S3.
 * Replaces PHP file_exists() checks before unlink().
 */
async function assetExists(keyOrUrl) {
  if (!keyOrUrl) return false;
  const key = urlToKey(keyOrUrl);
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Store an image from a remote URL directly into S3.
 * Replaces Utility::uploadMapImageintoFolder() — used for Google Maps
 * static map images saved to uploads/.
 *
 * @param {string} url        - Source URL to download
 * @param {string} folder     - Destination folder key
 * @param {string} entityId   - Owner entity ID
 * @returns {Promise<{key, publicUrl}>}
 */
async function storeImageFromUrl(url, folder = 'tmp', entityId = '0') {
  return new Promise((resolve, reject) => {
    const key = `${FOLDER_MAP[folder] || FOLDER_MAP.tmp}/${entityId}/${randomUUID()}.jpg`;

    https.get(url, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', async () => {
        try {
          const body = Buffer.concat(chunks);
          await s3.send(new PutObjectCommand({
            Bucket:      BUCKET,
            Key:         key,
            Body:        body,
            ContentType: res.headers['content-type'] || 'image/jpeg',
          }));
          resolve({ key, publicUrl: `${CDN_BASE}/${key}` });
        } catch (e) {
          reject(e);
        }
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Upload a base64-encoded file to S3.
 * Replaces Utility::uploadFileintoFolder() for cases where the PHP API
 * received a base64 payload in the request body (e.g. mobile image upload).
 * Used in the Lambda when a base64 image is POST'd in JSON.
 *
 * @param {object} opts
 * @param {string} opts.base64Data  - Base64-encoded file content
 * @param {string} opts.folder      - Destination folder
 * @param {string} opts.entityId    - Owner entity ID
 * @param {string} [opts.mimeType]  - MIME type
 * @returns {Promise<{key, publicUrl}>}
 */
async function uploadBase64(opts = {}) {
  const { base64Data, folder = 'tmp', entityId = '0', mimeType = 'image/jpeg' } = opts;
  if (!base64Data) throw new Error('base64Data is required');

  const ext   = ALLOWED_TYPES[mimeType] || 'jpg';
  const key   = `${FOLDER_MAP[folder] || FOLDER_MAP.tmp}/${entityId}/${randomUUID()}.${ext}`;
  const body  = Buffer.from(base64Data, 'base64');

  await s3.send(new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         key,
    Body:        body,
    ContentType: mimeType,
  }));

  return { key, publicUrl: `${CDN_BASE}/${key}` };
}

/**
 * Convert a full S3 URL back to its key.
 */
function urlToKey(urlOrKey) {
  if (!urlOrKey.startsWith('http')) return urlOrKey;
  try {
    const u = new URL(urlOrKey);
    return u.pathname.replace(/^\//, '');
  } catch (_) {
    return urlOrKey;
  }
}

function getExtFromFilename(filename) {
  if (!filename) return null;
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : null;
}

module.exports = {
  BUCKET,
  CDN_BASE,
  FOLDER_MAP,
  generateUploadUrl,
  generateDownloadUrl,
  deleteAsset,
  assetExists,
  storeImageFromUrl,
  uploadBase64,
  urlToKey,
};
