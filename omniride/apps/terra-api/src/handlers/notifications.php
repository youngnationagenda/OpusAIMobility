<?php

declare(strict_types=1);

/**
 * Notification Publisher Handler
 *
 * Publishes push notification payloads to the OpusAIMobility SNS topic.
 * - Payload includes: title, body message, and notification type identifier.
 * - Retries failed publish attempts up to 3 times with exponential backoff (1s, 2s, 4s).
 * - If all retries fail, logs the failure and routes the payload to a dead-letter queue.
 *
 * Requirements: 10.1, 10.5
 */

namespace TerraAI\Handlers;

use Aws\Sns\SnsClient;
use Aws\Sqs\SqsClient;
use Aws\Exception\AwsException;

/** Maximum number of publish retry attempts */
const NOTIFICATION_MAX_RETRIES = 3;

/** Base delay in seconds for exponential backoff */
const NOTIFICATION_BASE_DELAY_SECONDS = 1;

/**
 * Calculates exponential backoff delay for a given retry attempt.
 *
 * @param int $attempt The retry attempt number (1-based: 1, 2, 3)
 * @return int Delay in seconds (1, 2, 4)
 */
function calculateNotificationBackoffDelay(int $attempt): int
{
    return (int) (NOTIFICATION_BASE_DELAY_SECONDS * pow(2, $attempt - 1));
}

/**
 * Validates the notification payload structure.
 *
 * @param array $payload The notification payload to validate
 * @return array{valid: bool, error: string|null} Validation result
 */
function validateNotificationPayload(array $payload): array
{
    if (!isset($payload['title']) || $payload['title'] === '') {
        return ['valid' => false, 'error' => 'Missing required field: title'];
    }

    if (!isset($payload['body']) || $payload['body'] === '') {
        return ['valid' => false, 'error' => 'Missing required field: body'];
    }

    if (!isset($payload['type']) || $payload['type'] === '') {
        return ['valid' => false, 'error' => 'Missing required field: type'];
    }

    return ['valid' => true, 'error' => null];
}

/**
 * Builds the SNS message from the notification payload.
 *
 * @param array $payload The notification payload containing title, body, and type
 * @return string JSON-encoded SNS message
 */
function buildSnsMessage(array $payload): string
{
    return json_encode([
        'title' => $payload['title'],
        'body' => $payload['body'],
        'type' => $payload['type'],
        'timestamp' => $payload['timestamp'] ?? date('c'),
    ], JSON_THROW_ON_ERROR);
}

/**
 * Publishes a notification to the SNS topic with retry logic.
 *
 * Implements exponential backoff: 1s, 2s, 4s between attempts.
 *
 * @param SnsClient $snsClient The AWS SNS client instance
 * @param string $topicArn The SNS topic ARN to publish to
 * @param array $payload The notification payload (title, body, type)
 * @param callable|null $sleepFn Optional sleep function for testing (defaults to sleep())
 * @return array{success: bool, messageId: string|null, error: string|null}
 */
function publishToSns(
    SnsClient $snsClient,
    string $topicArn,
    array $payload,
    ?callable $sleepFn = null
): array {
    $sleepFn = $sleepFn ?? 'sleep';
    $message = buildSnsMessage($payload);
    $lastError = null;

    for ($attempt = 1; $attempt <= NOTIFICATION_MAX_RETRIES; $attempt++) {
        try {
            $result = $snsClient->publish([
                'TopicArn' => $topicArn,
                'Message' => $message,
                'MessageAttributes' => [
                    'notificationType' => [
                        'DataType' => 'String',
                        'StringValue' => $payload['type'],
                    ],
                ],
            ]);

            return [
                'success' => true,
                'messageId' => $result['MessageId'] ?? null,
                'error' => null,
            ];
        } catch (AwsException $e) {
            $lastError = $e->getAwsErrorMessage() ?? $e->getMessage();

            if ($attempt < NOTIFICATION_MAX_RETRIES) {
                $delay = calculateNotificationBackoffDelay($attempt);
                $sleepFn($delay);
            }
        } catch (\Throwable $e) {
            $lastError = $e->getMessage();

            if ($attempt < NOTIFICATION_MAX_RETRIES) {
                $delay = calculateNotificationBackoffDelay($attempt);
                $sleepFn($delay);
            }
        }
    }

    return [
        'success' => false,
        'messageId' => null,
        'error' => $lastError ?? 'Publish failed after all retries',
    ];
}

/**
 * Routes a failed notification payload to the dead-letter queue for later reprocessing.
 *
 * @param SqsClient $sqsClient The AWS SQS client instance
 * @param string $dlqUrl The dead-letter queue URL
 * @param array $payload The original notification payload that failed to publish
 * @param string $failureReason The reason the publish failed
 * @return array{success: bool, error: string|null}
 */
function routeToDeadLetterQueue(
    SqsClient $sqsClient,
    string $dlqUrl,
    array $payload,
    string $failureReason
): array {
    try {
        $sqsClient->sendMessage([
            'QueueUrl' => $dlqUrl,
            'MessageBody' => json_encode([
                'payload' => $payload,
                'failureReason' => $failureReason,
                'failedAt' => date('c'),
            ], JSON_THROW_ON_ERROR),
            'MessageAttributes' => [
                'source' => [
                    'DataType' => 'String',
                    'StringValue' => 'terra-api-notifications',
                ],
                'notificationType' => [
                    'DataType' => 'String',
                    'StringValue' => $payload['type'] ?? 'unknown',
                ],
            ],
        ]);

        return ['success' => true, 'error' => null];
    } catch (\Throwable $e) {
        return ['success' => false, 'error' => $e->getMessage()];
    }
}

/**
 * Logs a notification publish failure.
 *
 * @param array $payload The notification payload that failed
 * @param string $reason The failure reason
 * @param bool $dlqRouted Whether the payload was successfully routed to DLQ
 * @return void
 */
function logNotificationFailure(array $payload, string $reason, bool $dlqRouted): void
{
    $logEntry = json_encode([
        'level' => 'error',
        'message' => 'Notification publish failed',
        'context' => [
            'title' => $payload['title'] ?? '',
            'type' => $payload['type'] ?? '',
            'reason' => $reason,
            'dlqRouted' => $dlqRouted,
            'timestamp' => date('c'),
        ],
    ], JSON_THROW_ON_ERROR);

    error_log($logEntry);
}

/**
 * Handles the notification publish HTTP request.
 *
 * Expects a JSON body with fields: title, body, type.
 * Requires SNS_TOPIC_ARN and NOTIFICATION_DLQ_URL environment variables.
 *
 * Response codes:
 *   - 200: Notification published successfully
 *   - 400: Invalid payload (missing required fields)
 *   - 500: Configuration error (missing env vars)
 *   - 502: All retries failed, payload routed to dead-letter queue
 *
 * @param array|null $payload Optional payload array (for testing), defaults to JSON body
 * @param SnsClient|null $snsClient Optional SNS client (for testing)
 * @param SqsClient|null $sqsClient Optional SQS client (for testing)
 * @param callable|null $sleepFn Optional sleep function (for testing)
 * @return void
 */
function handleNotificationPublish(
    ?array $payload = null,
    ?SnsClient $snsClient = null,
    ?SqsClient $sqsClient = null,
    ?callable $sleepFn = null
): void {
    header('Content-Type: application/json');

    // Parse payload from request body if not injected
    if ($payload === null) {
        $rawBody = file_get_contents('php://input');
        $payload = json_decode($rawBody, true);

        if (!is_array($payload)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid JSON payload']);
            return;
        }
    }

    // Validate payload structure
    $validation = validateNotificationPayload($payload);
    if (!$validation['valid']) {
        http_response_code(400);
        echo json_encode(['error' => $validation['error']]);
        return;
    }

    // Get SNS topic ARN from environment
    $topicArn = getenv('SNS_TOPIC_ARN');
    if ($topicArn === false || $topicArn === '') {
        http_response_code(500);
        echo json_encode(['error' => 'Notification service configuration error']);
        return;
    }

    // Get dead-letter queue URL from environment
    $dlqUrl = getenv('NOTIFICATION_DLQ_URL');
    if ($dlqUrl === false || $dlqUrl === '') {
        http_response_code(500);
        echo json_encode(['error' => 'Notification service configuration error']);
        return;
    }

    // Create SNS client if not injected
    if ($snsClient === null) {
        $snsClient = new SnsClient([
            'region' => getenv('AWS_REGION') ?: 'us-east-1',
            'version' => 'latest',
        ]);
    }

    // Attempt to publish with retries (Requirement 10.1, 10.5)
    $result = publishToSns($snsClient, $topicArn, $payload, $sleepFn);

    if ($result['success']) {
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'messageId' => $result['messageId'],
        ]);
        return;
    }

    // All retries failed — log failure and route to DLQ (Requirement 10.5)
    logNotificationFailure($payload, $result['error'] ?? 'Unknown error', false);

    // Create SQS client if not injected
    if ($sqsClient === null) {
        $sqsClient = new SqsClient([
            'region' => getenv('AWS_REGION') ?: 'us-east-1',
            'version' => 'latest',
        ]);
    }

    $dlqResult = routeToDeadLetterQueue(
        $sqsClient,
        $dlqUrl,
        $payload,
        $result['error'] ?? 'Unknown error'
    );

    // Log whether DLQ routing succeeded
    logNotificationFailure($payload, $result['error'] ?? 'Unknown error', $dlqResult['success']);

    http_response_code(502);
    echo json_encode([
        'error' => 'Notification delivery failed',
        'dlqRouted' => $dlqResult['success'],
    ]);
}

// Execute handler when accessed directly (not in test mode)
if (php_sapi_name() !== 'cli' || !defined('TERRA_TESTING')) {
    handleNotificationPublish();
}
