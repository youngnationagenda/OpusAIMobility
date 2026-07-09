<?php

declare(strict_types=1);

/**
 * JWT Authentication Middleware for TerraAI API
 *
 * Validates Cognito JWT tokens, checks signature against JWKS endpoint,
 * verifies expiration, and enforces role-based access control.
 *
 * Requirements: 7.4, 7.5, 7.6, 7.7
 */

namespace TerraAI\Middleware;

/**
 * Role-based permission map.
 * Defines which roles have access to which endpoint patterns.
 * Admin has access to everything; other roles have scoped access.
 */
const ROLE_PERMISSIONS = [
    'admin' => ['*'],
    'vendor' => ['/vendors/*', '/trips/*', '/uploads/*', '/notifications/*', '/chat/*'],
    'business' => ['/business/*', '/trips/*', '/uploads/*', '/notifications/*', '/chat/*'],
    'rider' => ['/trips/*', '/riders/*', '/uploads/*', '/notifications/*', '/chat/*'],
    'customer' => ['/trips/*', '/customers/*', '/uploads/*', '/notifications/*', '/chat/*'],
];

/** Valid role values matching Cognito custom:role attribute */
const VALID_ROLES = ['rider', 'customer', 'vendor', 'business', 'admin'];

/**
 * JWKS cache to avoid fetching on every request.
 * In production this would use a proper cache (Redis/file), but for
 * container-scoped PHP-FPM processes, APCu or static var is sufficient.
 */
$jwksCache = null;
$jwksCacheExpiry = 0;

/**
 * Main authentication middleware entry point.
 *
 * Call this function at the top of protected routes. It validates the JWT
 * from the Authorization header and checks role permissions for the request path.
 *
 * @param string $requestPath The request path (after /terra prefix is stripped)
 * @param string|null $requiredRole Optional specific role required (overrides path-based check)
 * @return array{sub: string, email: string, role: string, claims: array} Decoded token claims on success
 */
function authenticate(string $requestPath, ?string $requiredRole = null): array
{
    $token = extractBearerToken();

    if ($token === null) {
        sendError(401, 'Authentication credentials required');
    }

    $decoded = validateAndDecodeToken($token);

    if ($decoded === null) {
        // Error already sent by validateAndDecodeToken
        exit;
    }

    $role = $decoded['custom:role'] ?? null;

    if ($requiredRole !== null) {
        if ($role !== $requiredRole && $role !== 'admin') {
            sendError(403, 'Insufficient permissions');
        }
    } else {
        if (!hasPermission($role, $requestPath)) {
            sendError(403, 'Insufficient permissions');
        }
    }

    return [
        'sub' => $decoded['sub'] ?? '',
        'email' => $decoded['email'] ?? '',
        'role' => $role ?? '',
        'claims' => $decoded,
    ];
}

/**
 * Extracts the Bearer token from the Authorization header.
 *
 * @return string|null The token string, or null if header is missing/malformed
 */
function extractBearerToken(): ?string
{
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? null;

    if ($authHeader === null || $authHeader === '') {
        return null;
    }

    if (!preg_match('/^Bearer\s+(.+)$/i', $authHeader, $matches)) {
        return null;
    }

    $token = trim($matches[1]);
    return $token !== '' ? $token : null;
}

/**
 * Validates and decodes a JWT token against Cognito JWKS.
 *
 * Performs:
 * 1. Structural validation (3 base64url-encoded parts)
 * 2. Header parsing to extract kid (key ID)
 * 3. JWKS fetch and signature verification
 * 4. Expiration check
 * 5. Issuer validation
 *
 * @param string $token The raw JWT string
 * @return array|null Decoded payload claims, or null if invalid (error sent)
 */
function validateAndDecodeToken(string $token): ?array
{
    // Step 1: Structural validation - JWT must have exactly 3 parts
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        sendError(401, 'Invalid token format');
        return null;
    }

    [$headerB64, $payloadB64, $signatureB64] = $parts;

    // Step 2: Decode header
    $header = base64UrlDecode($headerB64);
    if ($header === null) {
        sendError(401, 'Invalid token format');
        return null;
    }

    $headerData = json_decode($header, true);
    if (!is_array($headerData) || !isset($headerData['kid']) || !isset($headerData['alg'])) {
        sendError(401, 'Invalid token format');
        return null;
    }

    // Step 3: Decode payload
    $payload = base64UrlDecode($payloadB64);
    if ($payload === null) {
        sendError(401, 'Invalid token format');
        return null;
    }

    $claims = json_decode($payload, true);
    if (!is_array($claims)) {
        sendError(401, 'Invalid token format');
        return null;
    }

    // Step 4: Verify signature against JWKS
    $kid = $headerData['kid'];
    $alg = $headerData['alg'];

    $jwks = fetchJwks();
    if ($jwks === null) {
        sendError(401, 'Token validation failed');
        return null;
    }

    $publicKey = findKeyByKid($jwks, $kid);
    if ($publicKey === null) {
        sendError(401, 'Invalid token format');
        return null;
    }

    $signedData = $headerB64 . '.' . $payloadB64;
    $signature = base64UrlDecodeRaw($signatureB64);
    if ($signature === null) {
        sendError(401, 'Invalid token format');
        return null;
    }

    if (!verifySignature($signedData, $signature, $publicKey, $alg)) {
        sendError(401, 'Invalid token format');
        return null;
    }

    // Step 5: Check expiration
    if (!isset($claims['exp']) || !is_numeric($claims['exp'])) {
        sendError(401, 'Invalid token format');
        return null;
    }

    if ((int) $claims['exp'] < time()) {
        sendError(401, 'Token expired');
        return null;
    }

    // Step 6: Verify issuer matches our Cognito User Pool
    $expectedIssuer = getExpectedIssuer();
    if ($expectedIssuer !== null && isset($claims['iss']) && $claims['iss'] !== $expectedIssuer) {
        sendError(401, 'Invalid token format');
        return null;
    }

    return $claims;
}

/**
 * Fetches the JWKS from the Cognito User Pool well-known endpoint.
 * Results are cached for 1 hour to reduce network calls.
 *
 * @return array|null The JWKS keys array, or null on failure
 */
function fetchJwks(): ?array
{
    global $jwksCache, $jwksCacheExpiry;

    // Return cached JWKS if still valid
    if ($jwksCache !== null && time() < $jwksCacheExpiry) {
        return $jwksCache;
    }

    $region = getenv('COGNITO_REGION') ?: 'us-east-1';
    $userPoolId = getenv('COGNITO_USER_POOL_ID') ?: '';

    if ($userPoolId === '') {
        return null;
    }

    $jwksUrl = sprintf(
        'https://cognito-idp.%s.amazonaws.com/%s/.well-known/jwks.json',
        $region,
        $userPoolId
    );

    $context = stream_context_create([
        'http' => [
            'timeout' => 5,
            'method' => 'GET',
        ],
        'ssl' => [
            'verify_peer' => true,
            'verify_peer_name' => true,
        ],
    ]);

    $response = @file_get_contents($jwksUrl, false, $context);
    if ($response === false) {
        return null;
    }

    $jwksData = json_decode($response, true);
    if (!is_array($jwksData) || !isset($jwksData['keys']) || !is_array($jwksData['keys'])) {
        return null;
    }

    // Cache for 1 hour
    $jwksCache = $jwksData['keys'];
    $jwksCacheExpiry = time() + 3600;

    return $jwksCache;
}

/**
 * Finds a public key in the JWKS by its key ID (kid).
 *
 * @param array $jwks The JWKS keys array
 * @param string $kid The key ID to find
 * @return resource|null OpenSSL public key resource, or null if not found
 */
function findKeyByKid(array $jwks, string $kid)
{
    foreach ($jwks as $key) {
        if (!is_array($key) || ($key['kid'] ?? '') !== $kid) {
            continue;
        }

        if (($key['kty'] ?? '') !== 'RSA') {
            continue;
        }

        return rsaJwkToPublicKey($key);
    }

    return null;
}

/**
 * Converts an RSA JWK (JSON Web Key) to an OpenSSL public key resource.
 *
 * @param array $jwk The JWK containing n (modulus) and e (exponent)
 * @return resource|null OpenSSL public key resource
 */
function rsaJwkToPublicKey(array $jwk)
{
    if (!isset($jwk['n']) || !isset($jwk['e'])) {
        return null;
    }

    $modulus = base64UrlDecodeRaw($jwk['n']);
    $exponent = base64UrlDecodeRaw($jwk['e']);

    if ($modulus === null || $exponent === null) {
        return null;
    }

    // Build DER-encoded RSA public key
    $modulusEncoded = encodeAsn1Integer($modulus);
    $exponentEncoded = encodeAsn1Integer($exponent);

    $rsaPublicKey = encodeAsn1Sequence($modulusEncoded . $exponentEncoded);

    // Wrap in SubjectPublicKeyInfo structure
    $algorithmIdentifier = encodeAsn1Sequence(
        // OID for rsaEncryption: 1.2.840.113549.1.1.1
        "\x06\x09\x2a\x86\x48\x86\xf7\x0d\x01\x01\x01" .
        // NULL parameters
        "\x05\x00"
    );

    $bitString = "\x00" . $rsaPublicKey;
    $bitStringEncoded = "\x03" . encodeAsn1Length(strlen($bitString)) . $bitString;

    $publicKeyInfo = encodeAsn1Sequence($algorithmIdentifier . $bitStringEncoded);

    $pem = "-----BEGIN PUBLIC KEY-----\n" .
        chunk_split(base64_encode($publicKeyInfo), 64, "\n") .
        "-----END PUBLIC KEY-----";

    $key = openssl_pkey_get_public($pem);
    return $key !== false ? $key : null;
}

/**
 * Verifies the JWT signature using the public key.
 *
 * @param string $signedData The header.payload portion of the JWT
 * @param string $signature The decoded signature bytes
 * @param resource $publicKey The OpenSSL public key
 * @param string $alg The algorithm (RS256, RS384, RS512)
 * @return bool True if signature is valid
 */
function verifySignature(string $signedData, string $signature, $publicKey, string $alg): bool
{
    $algorithmMap = [
        'RS256' => OPENSSL_ALGO_SHA256,
        'RS384' => OPENSSL_ALGO_SHA384,
        'RS512' => OPENSSL_ALGO_SHA512,
    ];

    $opensslAlg = $algorithmMap[$alg] ?? null;
    if ($opensslAlg === null) {
        return false;
    }

    $result = openssl_verify($signedData, $signature, $publicKey, $opensslAlg);
    return $result === 1;
}

/**
 * Checks whether a given role has permission to access the specified path.
 *
 * @param string|null $role The user's role from custom:role claim
 * @param string $path The request path being accessed
 * @return bool True if the role has permission
 */
function hasPermission(?string $role, string $path): bool
{
    if ($role === null || $role === '' || !in_array($role, VALID_ROLES, true)) {
        return false;
    }

    $allowedPatterns = ROLE_PERMISSIONS[$role] ?? [];

    foreach ($allowedPatterns as $pattern) {
        if ($pattern === '*') {
            return true;
        }

        if (matchPath($pattern, $path)) {
            return true;
        }
    }

    return false;
}

/**
 * Matches a path against a pattern with wildcard support.
 * Patterns use * as a wildcard matching any characters.
 *
 * @param string $pattern The pattern (e.g., '/trips/*')
 * @param string $path The actual request path
 * @return bool True if the path matches the pattern
 */
function matchPath(string $pattern, string $path): bool
{
    // Convert pattern to regex
    $regex = '/^' . str_replace(['\*'], ['.*'], preg_quote($pattern, '/')) . '$/';
    return (bool) preg_match($regex, $path);
}

/**
 * Gets the expected token issuer URL from environment variables.
 *
 * @return string|null The issuer URL, or null if env vars not configured
 */
function getExpectedIssuer(): ?string
{
    $region = getenv('COGNITO_REGION') ?: 'us-east-1';
    $userPoolId = getenv('COGNITO_USER_POOL_ID') ?: '';

    if ($userPoolId === '') {
        return null;
    }

    return sprintf('https://cognito-idp.%s.amazonaws.com/%s', $region, $userPoolId);
}

/**
 * Sends a JSON error response and terminates execution.
 *
 * @param int $statusCode HTTP status code (401 or 403)
 * @param string $message Error message
 * @return never
 */
function sendError(int $statusCode, string $message): never
{
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode(['error' => $message]);
    exit;
}

// --- ASN.1 DER Encoding Helpers ---

/**
 * Encodes a binary string as an ASN.1 INTEGER.
 */
function encodeAsn1Integer(string $data): string
{
    // If the high bit is set, prepend a zero byte
    if (ord($data[0]) & 0x80) {
        $data = "\x00" . $data;
    }

    return "\x02" . encodeAsn1Length(strlen($data)) . $data;
}

/**
 * Encodes data as an ASN.1 SEQUENCE.
 */
function encodeAsn1Sequence(string $data): string
{
    return "\x30" . encodeAsn1Length(strlen($data)) . $data;
}

/**
 * Encodes an ASN.1 length value (DER format).
 */
function encodeAsn1Length(int $length): string
{
    if ($length < 128) {
        return chr($length);
    }

    $bytes = '';
    $temp = $length;
    while ($temp > 0) {
        $bytes = chr($temp & 0xFF) . $bytes;
        $temp >>= 8;
    }

    return chr(0x80 | strlen($bytes)) . $bytes;
}

// --- Base64URL Helpers ---

/**
 * Decodes a base64url-encoded string to a regular string.
 *
 * @param string $input Base64url-encoded data
 * @return string|null Decoded string, or null on failure
 */
function base64UrlDecode(string $input): ?string
{
    $remainder = strlen($input) % 4;
    if ($remainder) {
        $input .= str_repeat('=', 4 - $remainder);
    }

    $decoded = base64_decode(strtr($input, '-_', '+/'), true);
    return $decoded !== false ? $decoded : null;
}

/**
 * Decodes base64url-encoded data to raw binary.
 *
 * @param string $input Base64url-encoded data
 * @return string|null Raw binary data, or null on failure
 */
function base64UrlDecodeRaw(string $input): ?string
{
    return base64UrlDecode($input);
}
