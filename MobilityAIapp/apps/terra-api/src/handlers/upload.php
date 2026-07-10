<?php

declare(strict_types=1);

/**
 * S3 File Upload Handler
 *
 * Stores uploaded files in S3 via AWS SDK.
 * - Rejects files > 50 MB with HTTP 413 before upload attempt.
 * - Retries failed uploads up to 3 times with exponential backoff (1s, 2s, 4s).
 * - Returns HTTP 502 if all retries fail.
 *
 * Requirements: 9.2, 9.5
 */

namespace TerraAI\Handlers;

use Aws\S3\S3Client;
use Aws\Exception\AwsException;

/** Maximum allowed file size in bytes (50 MB) */
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

/** Maximum number of upload retry attempts */
const MAX_RETRIES = 3;

/** Base delay in seconds for exponential backoff */
const BASE_DELAY_SECONDS = 1;

/**
 * Validates that the uploaded file does not exceed the maximum size limit.
 *
 * @param int $fileSizeBytes The size of the uploaded file in bytes
 * @return bool True if file size is within limits, false otherwise
 */
function validateFileSize(int $fileSizeBytes): bool
{
    return $fileSizeBytes <= MAX_FILE_SIZE_BYTES;
}

/**
 * Calculates exponential backoff delay for a given retry attempt.
 *
 * @param int $attempt The retry attempt number (1-based: 1, 2, 3)
 * @return int Delay in seconds (1, 2, 4)
 */
function calculateBackoffDelay(int $attempt): int
{
    return (int) (BASE_DELAY_SECONDS * pow(2, $attempt - 1));
}

/**
 * Uploads a file to S3 with retry logic and exponential backoff.
 *
 * @param S3Client $s3Client The AWS S3 client instance
 * @param string $bucket The target S3 bucket name
 * @param string $key The S3 object key (path within bucket)
 * @param string $filePath Local file path to upload
 * @param string $mimeType The MIME type of the file
 * @param callable|null $sleepFn Optional sleep function for testing (defaults to sleep())
 * @return array{success: bool, error: string|null} Upload result
 */
function uploadToS3(
    S3Client $s3Client,
    string $bucket,
    string $key,
    string $filePath,
    string $mimeType,
    ?callable $sleepFn = null
): array {
    $sleepFn = $sleepFn ?? 'sleep';

    for ($attempt = 1; $attempt <= MAX_RETRIES; $attempt++) {
        try {
            $s3Client->putObject([
                'Bucket' => $bucket,
                'Key' => $key,
                'SourceFile' => $filePath,
                'ContentType' => $mimeType,
            ]);

            return ['success' => true, 'error' => null];
        } catch (AwsException $e) {
            $errorMessage = $e->getAwsErrorMessage() ?? $e->getMessage();

            if ($attempt < MAX_RETRIES) {
                $delay = calculateBackoffDelay($attempt);
                $sleepFn($delay);
            }
        } catch (\Throwable $e) {
            $errorMessage = $e->getMessage();

            if ($attempt < MAX_RETRIES) {
                $delay = calculateBackoffDelay($attempt);
                $sleepFn($delay);
            }
        }
    }

    return ['success' => false, 'error' => $errorMessage ?? 'Upload failed after all retries'];
}

/**
 * Generates an S3 object key from the original filename and user context.
 *
 * @param int $userId The ID of the uploading user
 * @param string $originalFilename The original filename from the upload
 * @return string The S3 key for the file
 */
function generateS3Key(int $userId, string $originalFilename): string
{
    $timestamp = time();
    $safeName = preg_replace('/[^a-zA-Z0-9._-]/', '_', $originalFilename);
    return sprintf('uploads/%d/%d_%s', $userId, $timestamp, $safeName);
}

/**
 * Handles the file upload HTTP request.
 *
 * Expects a multipart form upload with a 'file' field.
 * Requires S3_UPLOAD_BUCKET environment variable to be set.
 *
 * Response codes:
 *   - 200: File uploaded successfully, returns S3 key and metadata
 *   - 400: No file provided or invalid request
 *   - 413: File exceeds 50 MB limit
 *   - 502: S3 upload failed after all retries
 *
 * @param array|null $fileData Optional file data array (for testing), defaults to $_FILES['file']
 * @param S3Client|null $s3Client Optional S3 client (for testing)
 * @param callable|null $sleepFn Optional sleep function (for testing)
 * @return void
 */
function handleUploadRequest(
    ?array $fileData = null,
    ?S3Client $s3Client = null,
    ?callable $sleepFn = null
): void {
    header('Content-Type: application/json');

    // Get file data from request or injected test data
    $file = $fileData ?? ($_FILES['file'] ?? null);

    if ($file === null || !isset($file['tmp_name'], $file['size'], $file['name'])) {
        http_response_code(400);
        echo json_encode(['error' => 'No file provided']);
        return;
    }

    // Check for upload errors
    if (isset($file['error']) && $file['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['error' => 'File upload error']);
        return;
    }

    $fileSize = (int) $file['size'];
    $originalFilename = $file['name'];
    $tmpPath = $file['tmp_name'];
    $mimeType = $file['type'] ?? 'application/octet-stream';

    // Validate file size — reject before attempting upload (Requirement 9.2)
    if (!validateFileSize($fileSize)) {
        http_response_code(413);
        echo json_encode([
            'error' => 'File too large',
            'maxSize' => '50MB',
        ]);
        return;
    }

    // Get S3 bucket from environment
    $bucket = getenv('S3_UPLOAD_BUCKET');
    if ($bucket === false || $bucket === '') {
        http_response_code(500);
        echo json_encode(['error' => 'Storage configuration error']);
        return;
    }

    // Get user ID from request context (set by auth middleware)
    $userId = $GLOBALS['terra_user_id'] ?? 0;

    // Generate S3 key preserving some structure
    $s3Key = generateS3Key((int) $userId, $originalFilename);

    // Create S3 client if not injected
    if ($s3Client === null) {
        $s3Client = new S3Client([
            'region' => getenv('AWS_REGION') ?: 'us-east-1',
            'version' => 'latest',
        ]);
    }

    // Attempt upload with retries (Requirement 9.5)
    $result = uploadToS3($s3Client, $bucket, $s3Key, $tmpPath, $mimeType, $sleepFn);

    if (!$result['success']) {
        // All retries exhausted — return HTTP 502
        http_response_code(502);
        echo json_encode([
            'error' => 'Upload could not be completed',
        ]);
        return;
    }

    // Success
    http_response_code(200);
    echo json_encode([
        'key' => $s3Key,
        'originalFilename' => $originalFilename,
        'size' => $fileSize,
        'mimeType' => $mimeType,
    ]);
}

// Execute handler when accessed directly (not in test mode)
if (php_sapi_name() !== 'cli' || !defined('TERRA_TESTING')) {
    handleUploadRequest();
}
