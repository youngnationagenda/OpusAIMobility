<?php

declare(strict_types=1);

/**
 * Device Token Management Handler
 *
 * Manages push notification device token registration, rotation, and cleanup.
 * - Stores at most 10 device tokens per user; when 11th registered, removes oldest.
 * - On token rotation (same device, new token): replaces previous token without duplicate.
 * - On stale token detection (EndpointDisabled/InvalidParameter): removes token,
 *   logs event with user ID, endpoint ARN, and timestamp.
 *
 * Requirements: 10.2, 10.3, 10.4, 10.6
 */

namespace TerraAI\Handlers;

use Aws\Sns\SnsClient;
use Aws\Exception\AwsException;

/** Maximum number of device tokens allowed per user */
const MAX_TOKENS_PER_USER = 10;

/** SNS error codes indicating a stale/invalid endpoint */
const STALE_TOKEN_ERROR_CODES = ['EndpointDisabled', 'InvalidParameter'];

/**
 * Registers a device token for a user.
 *
 * Rules:
 * 1. If the same deviceId already has a token, replace it (rotation) — no duplicate.
 * 2. After adding, if count exceeds MAX_TOKENS_PER_USER, remove the oldest token.
 * 3. At most MAX_TOKENS_PER_USER tokens are stored per user.
 *
 * @param array $existingTokens Current tokens for the user, each with keys:
 *   - token: string (FCM/APNs token)
 *   - deviceId: string (stable device identifier)
 *   - endpointArn: string (SNS platform endpoint ARN)
 *   - registeredAt: string (ISO 8601 timestamp)
 * @param array $newToken The new token to register (same structure)
 * @return array{tokens: array, removedToken: array|null, wasRotation: bool}
 */
function registerDeviceToken(array $existingTokens, array $newToken): array
{
    $tokens = $existingTokens;
    $removedToken = null;
    $wasRotation = false;

    // Check for token rotation: same device, new token
    $existingIndex = null;
    foreach ($tokens as $index => $t) {
        if ($t['deviceId'] === $newToken['deviceId']) {
            $existingIndex = $index;
            break;
        }
    }

    if ($existingIndex !== null) {
        // Rotation: replace previous token for this device
        $removedToken = $tokens[$existingIndex];
        array_splice($tokens, $existingIndex, 1);
        $wasRotation = true;
    }

    // Add the new token
    $tokens[] = $newToken;

    // Enforce the limit: if more than MAX_TOKENS_PER_USER, remove oldest
    if (count($tokens) > MAX_TOKENS_PER_USER) {
        // Sort by registeredAt to find the oldest
        usort($tokens, function ($a, $b) {
            return strtotime($a['registeredAt']) - strtotime($b['registeredAt']);
        });
        // Remove the oldest (first in sorted order)
        $oldest = array_shift($tokens);
        $removedToken = $oldest;
    }

    return [
        'tokens' => $tokens,
        'removedToken' => $removedToken,
        'wasRotation' => $wasRotation,
    ];
}

/**
 * Removes a stale device token detected via SNS error response.
 *
 * Called when SNS returns EndpointDisabled or InvalidParameter during a publish attempt.
 * Removes the token and produces a log entry with user ID, endpoint ARN, and timestamp.
 *
 * @param array $existingTokens Current tokens for the user
 * @param string $staleEndpointArn The ARN that returned an error
 * @param string $userId The user ID owning the token
 * @param string $reason The SNS error code that triggered removal
 * @param string $timestamp The removal timestamp (ISO 8601)
 * @return array|null Removal result or null if token not found
 */
function removeStaleToken(
    array $existingTokens,
    string $staleEndpointArn,
    string $userId,
    string $reason,
    string $timestamp
): ?array {
    $staleIndex = null;
    foreach ($existingTokens as $index => $t) {
        if ($t['endpointArn'] === $staleEndpointArn) {
            $staleIndex = $index;
            break;
        }
    }

    if ($staleIndex === null) {
        return null;
    }

    $removedToken = $existingTokens[$staleIndex];
    $tokens = array_values(array_filter(
        $existingTokens,
        fn($_, $i) => $i !== $staleIndex,
        ARRAY_FILTER_USE_BOTH
    ));

    $logEntry = [
        'userId' => $userId,
        'endpointArn' => $staleEndpointArn,
        'removedAt' => $timestamp,
        'reason' => $reason,
    ];

    // Emit structured log entry for the stale token removal event
    error_log(json_encode([
        'event' => 'stale_token_removed',
        'userId' => $userId,
        'endpointArn' => $staleEndpointArn,
        'timestamp' => $timestamp,
        'reason' => $reason,
    ]));

    return [
        'tokens' => $tokens,
        'removedToken' => $removedToken,
        'logEntry' => $logEntry,
    ];
}

/**
 * Checks if an SNS error code indicates a stale/invalid token.
 *
 * @param string $errorCode The error code from SNS
 * @return bool True if the error code indicates a stale token
 */
function isStaleTokenError(string $errorCode): bool
{
    return in_array($errorCode, STALE_TOKEN_ERROR_CODES, true);
}

/**
 * Creates an SNS platform endpoint for a device token.
 *
 * @param SnsClient $snsClient The SNS client instance
 * @param string $platformApplicationArn The SNS platform application ARN
 * @param string $token The device token (FCM/APNs)
 * @param string $userId The user ID for custom user data
 * @return array{endpointArn: string}|null The endpoint ARN or null on failure
 */
function createPlatformEndpoint(
    SnsClient $snsClient,
    string $platformApplicationArn,
    string $token,
    string $userId
): ?array {
    try {
        $result = $snsClient->createPlatformEndpoint([
            'PlatformApplicationArn' => $platformApplicationArn,
            'Token' => $token,
            'CustomUserData' => $userId,
        ]);

        return ['endpointArn' => $result['EndpointArn']];
    } catch (AwsException $e) {
        error_log(json_encode([
            'event' => 'create_endpoint_failed',
            'userId' => $userId,
            'error' => $e->getAwsErrorMessage() ?? $e->getMessage(),
        ]));
        return null;
    }
}

/**
 * Handles the device token registration HTTP request.
 *
 * Expects JSON body with:
 *   - token: string (FCM/APNs device token)
 *   - deviceId: string (stable device identifier)
 *   - platform: string ('android' | 'ios')
 *
 * Response codes:
 *   - 200: Token registered successfully
 *   - 400: Missing required fields
 *   - 500: Internal error
 *
 * @return void
 */
function handleDeviceTokenRequest(): void
{
    header('Content-Type: application/json');

    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($method !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }

    // Parse request body
    $body = json_decode(file_get_contents('php://input'), true);

    if (!$body || !isset($body['token'], $body['deviceId'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields: token, deviceId']);
        return;
    }

    $token = $body['token'];
    $deviceId = $body['deviceId'];
    $platform = $body['platform'] ?? 'android';

    // Get user ID from request context (set by auth middleware)
    $userId = $GLOBALS['terra_user_id'] ?? null;

    if ($userId === null) {
        http_response_code(401);
        echo json_encode(['error' => 'Authentication required']);
        return;
    }

    // Get SNS configuration from environment
    $snsTopicArn = getenv('SNS_TOPIC_ARN');
    $platformAppArn = getenv('SNS_PLATFORM_APP_ARN');

    if (!$snsTopicArn || !$platformAppArn) {
        http_response_code(500);
        echo json_encode(['error' => 'Notification configuration error']);
        return;
    }

    // Create SNS client
    $snsClient = new SnsClient([
        'region' => getenv('AWS_REGION') ?: 'us-east-1',
        'version' => 'latest',
    ]);

    // Create the platform endpoint in SNS
    $endpointResult = createPlatformEndpoint($snsClient, $platformAppArn, $token, (string)$userId);

    if ($endpointResult === null) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create notification endpoint']);
        return;
    }

    $now = gmdate('Y-m-d\TH:i:s\Z');

    $newToken = [
        'token' => $token,
        'deviceId' => $deviceId,
        'endpointArn' => $endpointResult['endpointArn'],
        'registeredAt' => $now,
    ];

    // Load existing tokens for user from data store
    // (In production this would query DynamoDB or RDS; here we use a placeholder)
    $existingTokens = loadUserTokens((string)$userId);

    // Register the new token with limit enforcement and rotation handling
    $result = registerDeviceToken($existingTokens, $newToken);

    // Persist updated tokens
    saveUserTokens((string)$userId, $result['tokens']);

    // If a token was removed due to limit, delete the SNS endpoint
    if ($result['removedToken'] !== null && !$result['wasRotation']) {
        try {
            $snsClient->deleteEndpoint([
                'EndpointArn' => $result['removedToken']['endpointArn'],
            ]);
        } catch (AwsException $e) {
            error_log(json_encode([
                'event' => 'delete_endpoint_failed',
                'endpointArn' => $result['removedToken']['endpointArn'],
                'error' => $e->getAwsErrorMessage() ?? $e->getMessage(),
            ]));
        }
    }

    // If rotation occurred, delete the old SNS endpoint
    if ($result['wasRotation'] && $result['removedToken'] !== null) {
        try {
            $snsClient->deleteEndpoint([
                'EndpointArn' => $result['removedToken']['endpointArn'],
            ]);
        } catch (AwsException $e) {
            error_log(json_encode([
                'event' => 'delete_rotated_endpoint_failed',
                'endpointArn' => $result['removedToken']['endpointArn'],
                'error' => $e->getAwsErrorMessage() ?? $e->getMessage(),
            ]));
        }
    }

    http_response_code(200);
    echo json_encode([
        'endpointArn' => $endpointResult['endpointArn'],
        'deviceId' => $deviceId,
        'wasRotation' => $result['wasRotation'],
    ]);
}

/**
 * Loads device tokens for a user from the data store.
 * In production, this queries DynamoDB or RDS.
 *
 * @param string $userId The user ID
 * @return array List of device tokens
 */
function loadUserTokens(string $userId): array
{
    // Placeholder — in production, query DynamoDB:
    // Table: opusaimobility-device-tokens, Key: { userId }
    // Returns items sorted by registeredAt ascending
    return [];
}

/**
 * Saves device tokens for a user to the data store.
 * In production, this writes to DynamoDB or RDS.
 *
 * @param string $userId The user ID
 * @param array $tokens The tokens to persist
 * @return void
 */
function saveUserTokens(string $userId, array $tokens): void
{
    // Placeholder — in production, write to DynamoDB:
    // Table: opusaimobility-device-tokens, Key: { userId }, Item: { tokens }
}

// Execute handler when accessed directly (not in test mode)
if (php_sapi_name() !== 'cli' || !defined('TERRA_TESTING')) {
    handleDeviceTokenRequest();
}
