<?php

declare(strict_types=1);

namespace TerraAI\Middleware;

use Monolog\Logger as MonologLogger;
use Monolog\Handler\StreamHandler;
use Monolog\Formatter\JsonFormatter;

/**
 * Structured JSON logger for TerraAI PHP API.
 *
 * Writes structured JSON log entries to stdout (CloudWatch picks these up).
 * Each entry includes: timestamp, level, message, request_id, and context.
 *
 * Usage:
 *   Logger::getInstance()->logRequest('POST', '/upload', 200, 45.2);
 *   Logger::getInstance()->logError('Upload failed', ['key' => 'uploads/...']);
 */
class Logger
{
    private static ?Logger $instance = null;
    private MonologLogger $logger;
    private string $requestId;

    private function __construct()
    {
        $this->requestId = uniqid('req_', true);
        $this->logger = new MonologLogger('terraai-api');

        $handler = new StreamHandler('php://stdout', MonologLogger::DEBUG);

        $formatter = new JsonFormatter(
            JsonFormatter::BATCH_MODE_NEWLINES,
            true // appendNewline
        );
        $handler->setFormatter($formatter);

        $this->logger->pushHandler($handler);
    }

    /**
     * Returns the singleton Logger instance.
     */
    public static function getInstance(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Resets the singleton (used in tests).
     */
    public static function reset(): void
    {
        self::$instance = null;
    }

    /**
     * Logs an HTTP request/response summary.
     *
     * @param string $method      HTTP method (GET, POST, etc.)
     * @param string $path        Request path
     * @param int    $statusCode  HTTP response status code
     * @param float  $durationMs  Request duration in milliseconds
     */
    public function logRequest(
        string $method,
        string $path,
        int $statusCode,
        float $durationMs
    ): void {
        $level = $statusCode >= 500 ? MonologLogger::ERROR
               : ($statusCode >= 400 ? MonologLogger::WARNING
               : MonologLogger::INFO);

        $this->logger->addRecord($level, 'HTTP request', [
            'request_id'  => $this->requestId,
            'method'      => $method,
            'path'        => $path,
            'status_code' => $statusCode,
            'duration_ms' => round($durationMs, 2),
        ]);
    }

    /**
     * Logs an error with optional context.
     *
     * @param string  $message Application error message
     * @param mixed[] $context Additional key-value context
     */
    public function logError(string $message, array $context = []): void
    {
        $this->logger->error($message, array_merge(
            ['request_id' => $this->requestId],
            $context
        ));
    }

    /**
     * Logs an info message with optional context.
     *
     * @param string  $message Informational message
     * @param mixed[] $context Additional key-value context
     */
    public function logInfo(string $message, array $context = []): void
    {
        $this->logger->info($message, array_merge(
            ['request_id' => $this->requestId],
            $context
        ));
    }

    /**
     * Logs a warning message with optional context.
     *
     * @param string  $message Warning message
     * @param mixed[] $context Additional key-value context
     */
    public function logWarning(string $message, array $context = []): void
    {
        $this->logger->warning($message, array_merge(
            ['request_id' => $this->requestId],
            $context
        ));
    }

    /**
     * Returns the current request ID (for correlation with other systems).
     */
    public function getRequestId(): string
    {
        return $this->requestId;
    }
}
