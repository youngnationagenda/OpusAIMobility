# omniride-api Lambda — Applied Patches

## Patch 1 — Auto-confirm Cognito users on signup (2026-07-12)

**Problem:** `authSignup` left users `UNCONFIRMED`. Sign-in blocked until email verified.

**Fix:** `AdminConfirmSignUpCommand` called immediately after `SignUpCommand`.

```js
// Added import:
AdminConfirmSignUpCommand

// After SignUpCommand in authSignup:
try {
  await cognito.send(new AdminConfirmSignUpCommand({
    UserPoolId: process.env.USER_POOL_ID || process.env.COGNITO_USER_POOL_ID,
    Username: email
  }));
} catch (ce) {
  if (ce.name !== 'NotAuthorizedException' && ce.name !== 'InvalidParameterException') throw ce;
}
```

---

## Patch 2 — DynamoDB userId partition key (2026-07-12)

**Problem:** `opusaimobility-users` table uses `userId` as partition key. Lambda
wrote `{id}` and read with `{id}` — every read/write failed with `ValidationException`.

**Fix:** All user reads/writes now use `{userId}` as the DynamoDB key.
`getUser` falls back to Scan+filter for backward compatibility.

---

## Patch 3 — JWT Auth Middleware (2026-07-12)

**Problem:** Protected routes had no authentication — anyone could read any user's data.

**Implementation:**
- `fetchJwks()` — fetches Cognito JWKS, 1-hour in-memory cache
- `verifyToken(token)` — pure Node.js RS256 verification (no external deps)
  - Checks expiry, issuer, kid, signature
- `requireAuth(event)` — reads `Authorization: Bearer <token>` header
  - Returns `{userId, email, payload}` on success
  - Returns `{authError: {statusCode: 401, ...}}` on failure

**Protected routes (return 401 without valid token):**

| Route | Guard |
|---|---|
| `GET /users/{id}` | `a.authError` |
| `GET /users/{id}/history` | `ah.authError` |
| `PUT /users/{id}/balance` | `ab.authError` |
| `GET /payments/history` | `ap.authError` (also scopes to token userId) |
| `POST /notifications/push` | `an.authError` |
| `POST /files/presign-upload` | `af.authError` (auto-injects userId from token) |
| `POST /users/sync` | `as.authError` |

**Token format:** Cognito RS256 JWT. Obtain via `POST /auth/signin`.

---

## DynamoDB GSI Indexes (2026-07-12)

4 Global Secondary Indexes created (all `ACTIVE`):

| Table | Index | Key |
|---|---|---|
| `opusaimobility-trips` | `customerId-index` | `customerId` (HASH) |
| `opusaimobility-orders` | `customerId-index` | `customerId` (HASH) |
| `opusaimobility-errands` | `customerId-index` | `customerId` (HASH) |
| `opusaimobility-transactions` | `userId-index` | `userId` (HASH) |

**Usage:** `GET /rides?userId=X`, `GET /orders?userId=X`, `GET /errands?userId=X`,
`GET /payments/history` (auto-scoped from JWT). Falls back to Scan+filter if index
unavailable.

---

## End-to-End Test Results — **11/11** ✅

| Test | HTTP | Result |
|---|---|---|
| POST /auth/signup | 200 | User created + auto-confirmed |
| POST /auth/signin | 200 | accessToken + idToken + refreshToken |
| GET /users/{id} — no token | **401** | "Authorization header required" |
| GET /payments/history — no token | **401** | "Authorization header required" |
| POST /notifications/push — no token | **401** | "Authorization header required" |
| POST /files/presign-upload — no token | **401** | "Authorization header required" |
| GET /users/{id} — valid token | **200** | User profile returned |
| GET /payments/history — valid token | **200** | Payment history (scoped to user) |
| GET /users/{id} — invalid token | **401** | "Invalid or expired token" |
| GET /rides?userId=X | **200** | Results via GSI/Scan |
| GET /orders?userId=X | **200** | Results via GSI/Scan |
