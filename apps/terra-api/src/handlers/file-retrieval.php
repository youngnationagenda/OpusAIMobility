<?php

declare(strict_types=1);

/**
 * File Retrieval Handler
 *
 * Returns a pre-signed S3 URL (1-hour expiry) for existing files.
 * Returns HTTP 404 if the requested file key does not exist in S3.
 *
 * Requirements: 9.3
 */

namespace TerraAI\Handlers;

use Aws\S3\S3Client;
use Aws\S3\Exception\S3Exception;

header('Content-Type: application/json');

/**
 * Creates and returns a configured S3 client instance.
 *
 * @return S3Client
 */
function getS3Client(): S3Client
{
    $region = getenv('AWS_REGION') ?: 'us-east-1';

    return new S3Client([
        'version' => 'latest',
        'region' => $region,
    ]);
}

/**
 * Checks whether a given S3 key exists in the specified bucket.
 *
 * @param S3Client $s3 The S3 client instance
 * @param string $bucket The S3 bucket name
 * @param string $key The object key to check
 * @return bool True if the object exists, false otherwise
 */
function fileExistsInS3(S3Client $s3, string $bucket, string $key): bool
{
    try {
        $s3->headObject([
            'Bucket' => $bucket,
            'Key' => $key,
        ]);
        return true;
    } catch (S3Exception $e) {
        if ($e->getStatusCode() === 404) {
            return false;
        }
        // Re-throw unexpected errors
        throw $e;
    }
}

/**
 * Generates a pre-signed URL for the given S3 object with 1-hour expiry.
 *
 * @param S3Client $s3 The S3 client instance
 * @param string $bucket The S3 bucket name
 * @param string $key The object key
 * @return string The pre-signed URL
 */
function generatePresignedUrl(S3Client $s3, string $bucket, string $key): string
{
    $command = $s3->getCommand('GetObject', [
        'Bucket' => $bucket,
        'Key' => $key,
    ]);

    $presignedRequest = $s3->createPresignedRequest($command, '+1 hour');

    return (string) $presignedRequest->getUri();
}

/**
 * Handles the file retrieval request.
 *
 * Expects the file key to be provided via query parameter `key` or
 * as a path segment after the handler route.
 *
 * @param string|null $fileKey The S3 file key to retrieve
 * @return void
 */
function handleFileRetrieval(?string $fileKey = null): void
{
    // Get file key from query parameter if not provided directly
    if ($fileKey === null) {
        $fileKey = $_GET['key'] ?? null;
    }

    if ($fileKey === null || $fileKey === '') {
        http_response_code(404);
        echo json_encode(['error' => 'File not found']);
        return;
    }

    $bucket = getenv('S3_UPLOAD_BUCKET') ?: '';

    if ($bucket === '') {
        http_response_code(500);
        echo json_encode(['error' => 'Storage configuration error']);
        return;
    }

    $s3 = getS3Client();

    // Check if file exists in S3
    try {
        $exists = fileExistsInS3($s3, $bucket, $fileKey);
    } catch (S3Exception $e) {
        http_response_code(502);
        echo json_encode(['error' => 'Storage service unavailable']);
        return;
    }

    if (!$exists) {
        http_response_code(404);
        echo json_encode(['error' => 'File not found']);
        return;
    }

    // Generate pre-signed URL with 1-hour expiry
    try {
        $url = generatePresignedUrl($s3, $bucket, $fileKey);
    } catch (\Throwable $e) {
        http_response_code(502);
        echo json_encode(['error' => 'Failed to generate download URL']);
        return;
    }

    http_response_code(200);
    echo json_encode([
        'url' => $url,
        'expiresIn' => 3600,
    ]);
}

// Execute handler when accessed directly (not in test mode)
if (php_sapi_name() !== 'cli' || !defined('TERRA_TESTING')) {
    handleFileRetrieval();
}
