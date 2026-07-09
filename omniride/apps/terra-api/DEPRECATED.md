# DEPRECATED — PHP Backend Scheduled for Removal

All functionality from this PHP backend has been migrated to AWS Lambda.

| PHP Handler | Lambda Replacement |
|-------------|-------------------|
| `handlers/upload.php` | `POST /files/presign-upload` |
| `handlers/file-retrieval.php` | `GET /files/presign-download` |
| `handlers/device-tokens.php` | `POST /devices/token`, `DELETE /devices/token` |
| `handlers/notifications.php` | `POST /notifications/push` (already existed) |
| `middleware/auth.php` | API Gateway Cognito Authorizer |
| `health.php` | `GET /health` |

**Do not add new features here.** All new code goes in `aws/lambda/index.js`.

**Removal target:** after Android app migration is validated in production.

**Lambda endpoint:** `https://0wv2nyk3je.execute-api.us-east-1.amazonaws.com/prod`
