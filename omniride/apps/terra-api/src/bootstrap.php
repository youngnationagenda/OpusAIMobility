<?php

declare(strict_types=1);

/**
 * TerraAI API Bootstrap
 *
 * Validates required environment variables at startup and establishes
 * a TLS-encrypted database connection to AWS RDS MySQL.
 *
 * Requirements: 2.1, 2.2, 2.4, 2.5
 */

namespace TerraAI;

/**
 * Required database environment variables.
 * If any of these are missing or empty, the application refuses to start.
 */
const REQUIRED_ENV_VARS = [
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'DB_USER',
    'DB_PASS',
];

/**
 * Validates that all required environment variables are present and non-empty.
 *
 * @return array{valid: bool, missing: string[]} Validation result with list of missing vars
 */
function validateEnvVars(): array
{
    $missing = [];

    foreach (REQUIRED_ENV_VARS as $varName) {
        $value = getenv($varName);
        if ($value === false || $value === '') {
            $missing[] = $varName;
        }
    }

    return [
        'valid' => empty($missing),
        'missing' => $missing,
    ];
}

/**
 * Creates a TLS-encrypted MySQLi connection to RDS using environment variables.
 *
 * Uses MYSQLI_CLIENT_SSL flag to enforce TLS 1.2+ connection as required
 * by the RDS instance configuration.
 *
 * @return \mysqli The database connection instance
 * @throws \RuntimeException If connection fails
 */
function createDatabaseConnection(): \mysqli
{
    $host = getenv('DB_HOST');
    $port = (int) getenv('DB_PORT');
    $dbName = getenv('DB_NAME');
    $user = getenv('DB_USER');
    $pass = getenv('DB_PASS');

    $mysqli = mysqli_init();

    if (!$mysqli) {
        throw new \RuntimeException('Failed to initialize MySQLi');
    }

    // Set connection timeout to 5 seconds (Requirement 2.2)
    $mysqli->options(MYSQLI_OPT_CONNECT_TIMEOUT, 5);

    // Enable SSL/TLS for the connection (Requirement 2.4)
    // AWS RDS uses Amazon's root CA - the rds-combined-ca-bundle.pem
    // is typically available at /etc/ssl/certs/ in the container
    $mysqli->ssl_set(
        null,                           // client key
        null,                           // client cert
        '/etc/ssl/certs/rds-combined-ca-bundle.pem', // CA cert
        null,                           // CA path
        null                            // cipher
    );

    // Connect with MYSQLI_CLIENT_SSL flag to enforce TLS
    $connected = $mysqli->real_connect(
        $host,
        $user,
        $pass,
        $dbName,
        $port,
        null,
        MYSQLI_CLIENT_SSL
    );

    if (!$connected) {
        throw new \RuntimeException(
            'Database connection failed: ' . $mysqli->connect_error
        );
    }

    return $mysqli;
}

/**
 * Runs the bootstrap validation and connection sequence.
 * Called when this file is included at application startup.
 *
 * If any required env var is missing, logs the error and exits with code 1.
 * If connection succeeds, stores the connection for use by the application.
 *
 * @return \mysqli|null Returns connection on success, null if called in validation-only mode
 */
function bootstrap(bool $validateOnly = false): ?\mysqli
{
    // Step 1: Validate required environment variables (Requirement 2.5)
    $validation = validateEnvVars();

    if (!$validation['valid']) {
        $missingList = implode(', ', $validation['missing']);
        $message = sprintf(
            '[TerraAI Bootstrap] ERROR: Missing required environment variable(s): %s. Application cannot start.',
            $missingList
        );

        // Log to stderr for container log capture
        error_log($message);

        if (!$validateOnly) {
            exit(1);
        }

        return null;
    }

    if ($validateOnly) {
        return null;
    }

    // Step 2: Establish TLS database connection (Requirements 2.2, 2.4)
    try {
        $connection = createDatabaseConnection();
    } catch (\RuntimeException $e) {
        error_log('[TerraAI Bootstrap] ERROR: ' . $e->getMessage());
        exit(1);
    }

    return $connection;
}

// Auto-execute bootstrap when this file is directly included (not in test mode)
if (php_sapi_name() !== 'cli' || !defined('TERRA_TESTING')) {
    $GLOBALS['terra_db'] = bootstrap();
}
