<?php

declare(strict_types=1);

/**
 * Health Check Endpoint
 *
 * Tests database connectivity and returns service health status.
 * Returns HTTP 200 with {"status": "ok"} when healthy.
 * Returns HTTP 503 with {"error": "Database connectivity failure"} when DB is unreachable.
 *
 * No internal addresses or credentials are exposed in error responses.
 *
 * Requirements: 3.6, 2.3
 */

header('Content-Type: application/json');

// Connection timeout in seconds
$connectionTimeout = 5;

$dbHost = getenv('DB_HOST') ?: '';
$dbPort = (int) (getenv('DB_PORT') ?: 3306);
$dbName = getenv('DB_NAME') ?: '';
$dbUser = getenv('DB_USER') ?: '';
$dbPass = getenv('DB_PASS') ?: '';

// If required env vars are missing, the service is unhealthy
if ($dbHost === '' || $dbName === '' || $dbUser === '' || $dbPass === '') {
    http_response_code(503);
    echo json_encode(['error' => 'Database connectivity failure']);
    exit;
}

try {
    $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $dbHost, $dbPort, $dbName);

    $pdo = new PDO($dsn, $dbUser, $dbPass, [
        PDO::ATTR_TIMEOUT => $connectionTimeout,
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => false,
    ]);

    // Execute a simple query to verify the connection is truly alive
    $pdo->query('SELECT 1');

    http_response_code(200);
    echo json_encode(['status' => 'ok']);
} catch (\Throwable $e) {
    // Do not expose internal addresses, credentials, or error details
    http_response_code(503);
    echo json_encode(['error' => 'Database connectivity failure']);
}
