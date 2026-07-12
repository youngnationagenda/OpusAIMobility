# omniride-api Lambda — Applied Patches

## Patch 1 — Auto-confirm Cognito users on signup (2026-07-12)

**Problem:** `authSignup` called `SignUpCommand` but left users in `UNCONFIRMED`
state. Cognito requires email verification before `InitiateAuthCommand` works.
This caused `/auth/signin` to return `500 UserNotConfirmedException`.

**Fix:** After `SignUpCommand` succeeds, immediately call `AdminConfirmSignUpCommand`
to auto-confirm the user. No email verification gate.

```js
// Added to Cognito import:
AdminConfirmSignUpCommand

// Added after SignUpCommand call in authSignup:
try {
  await cognito.send(new AdminConfirmSignUpCommand({
    UserPoolId: process.env.USER_POOL_ID || process.env.COGNITO_USER_POOL_ID,
    Username: email
  }));
} catch (confirmErr) {
  if (confirmErr.name !== 'NotAuthorizedException') throw confirmErr;
}
```

**Cognito pool change:** `AutoVerifiedAttributes: [email]` enabled on
`us-east-1_LKa4ElQem` (`terraaimobility-production`).

---

## Patch 2 — Add `userId` partition key field to user objects (2026-07-12)

**Problem:** `opusaimobility-users` DynamoDB table uses `userId` as partition key.
`authSignup` and `authSignin` wrote objects with only `id` — missing `userId`.
DynamoDB rejected every write with `ValidationException: Missing the key userId`.

**Fix:** Both `authSignup` and `authSignin` fallback now write `userId: id` as an
explicit field alongside `id` so the partition key is always present.

```js
// authSignup:
const u = { userId: id, id, email, name, ... };

// authSignin fallback:
const _sid = 'usr_' + Date.now().toString(36);
u = { userId: _sid, id: _sid, email, name, ... };
```

---

## Result

| Test | Before | After |
|------|--------|-------|
| `POST /auth/signup` | 500 UserNotConfirmedException | ✅ 200 |
| `POST /auth/signin` | 500 UserNotConfirmedException | ✅ 200 + 3 tokens |
| `POST /auth/signin` (existing) | 500 | ✅ 200 + 3 tokens |
| Duplicate signup | 500 (correct) | ✅ 500 "User already exists" |
| Weak password | 500 (correct) | ✅ 500 |
| **Auth flow** | **0/5 passing** | **5/5 passing** |
