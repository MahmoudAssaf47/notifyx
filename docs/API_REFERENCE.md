# API Reference

Base URL: `http://localhost:8080`

## Authentication

### Register

```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "min8chars",
  "name": "Your Name"
}
```

Response `201`:
```json
{
  "success": true,
  "user": { "id": "...", "email": "...", "name": "...", "role": "developer" },
  "tokens": { "accessToken": "...", "refreshToken": "..." }
}
```

### Login

```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

Response `200`: Same as register.

### Refresh Token

```
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your_refresh_token"
}
```

Response `200`:
```json
{
  "success": true,
  "tokens": { "accessToken": "...", "refreshToken": "..." }
}
```

### Create API Key

```
POST /api/auth/keys
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "appName": "my-app",
  "permissions": ["notify:send"],
  "expiresInDays": 90
}
```

Response `201`:
```json
{
  "success": true,
  "apiKey": "nx_...",
  "metadata": { "id": "...", "appName": "my-app", "prefix": "nx_abc123" }
}
```

### Revoke API Key

```
DELETE /api/auth/keys/:id
Authorization: Bearer <access_token>
```

### List API Keys

```
GET /api/auth/keys
Authorization: Bearer <access_token>
```

---

## Notifications

### Send Notification

```
POST /api/notify
Content-Type: application/json
x-api-key: <your_api_key>

{
  "channel": "discord",
  "body": "Message content",
  "subject": "Optional subject",
  "sender": {
    "name": "Sender Name",
    "email": "sender@example.com"
  },
  "to": "recipient@example.com",
  "metadata": {
    "buildId": "123",
    "environment": "production"
  }
}
```

**Supported channels:** `discord`, `slack`, `telegram`, `webhook`, `email`

**Email channel** requires `to` or `cc`:
```json
{
  "channel": "email",
  "body": "Email body",
  "subject": "Email Subject",
  "to": "user@example.com"
}
```

Response `200`:
```json
{
  "success": true,
  "messageId": "job_id",
  "channel": "discord",
  "timestamp": "2026-06-28T12:00:00.000Z"
}
```

---

## Admin

### Create App Configuration

```
POST /api/admin/apps
Content-Type: application/json
x-admin-key: <ADMIN_API_KEY>

{
  "appName": "my-app",
  "apiKey": "ak_live_...",
  "discordWebhook": "https://discord.com/api/webhooks/...",
  "slackWebhook": "https://hooks.slack.com/services/..."
}
```

### Get Analytics

```
GET /api/admin/analytics
x-admin-key: <ADMIN_API_KEY>
```

---

## Error Codes

| Status | Meaning |
|--------|---------|
| 400 | Validation error — check request body |
| 401 | Unauthorized — missing or invalid token/API key |
| 403 | Forbidden — insufficient permissions or spam detected |
| 404 | Resource not found |
| 429 | Rate limited — too many requests |
| 500 | Internal server error |

## Rate Limit Headers

All responses include:

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Max requests in window |
| `X-RateLimit-Remaining` | Requests left |
| `X-RateLimit-Reset` | Unix timestamp when window resets |
| `x-correlation-id` | Request trace ID |
