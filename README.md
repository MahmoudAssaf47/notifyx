<div align="center">

# NotifyX

**Multi-channel notification platform. Send to Discord, Slack, Telegram, Email, and Webhooks from a single API.**

[![Build](https://img.shields.io/badge/build-passing-brightgreen?style=flat-square)]()
[![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-orange?style=flat-square)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=flat-square&logo=typescript)]()

</div>

---

## What it does

NotifyX sits between your application and notification channels. You send one HTTP request, it routes to the right channel, handles retries, and logs everything. Built as 7 microservices with a shared TypeScript package.

## Quick Start

```bash
git clone https://github.com/MahmoudAssaf47/notifyx.git && cd notifyx
cp .env.example .env   # edit with your secrets
docker compose up -d
```

That's it. Gateway runs on `http://localhost:8080`.

## Architecture

```
Client → Gateway (:8080) → Notification Service → Queue → Delivery Worker → Channel
                                    ↓                               ↓
                              Spam Check                    Discord / Slack / Telegram / Email / Webhook
                                    ↓                               ↓
                              Audit Service ←────────────── Analytics Service
```

7 services: Gateway, Auth, Notification, Delivery, Audit, Analytics, Admin. Communication via pub/sub queue (Redis or in-memory fallback).

## Usage

### Register and login

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"secret123","name":"Your Name"}'

curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"secret123"}'
```

### Send a notification

```bash
curl -X POST http://localhost:8080/api/notify \
  -H "Content-Type: application/json" \
  -H "x-api-key: ak_live_your_api_key" \
  -d '{
    "channel": "discord",
    "body": "Deploy succeeded",
    "subject": "Deploy",
    "sender": {"name": "CI Bot"}
  }'
```

### Create an API key

```bash
curl -X POST http://localhost:8080/api/auth/keys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"appName":"my-app","permissions":["notify:send"]}'
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | Yes | Min 32 chars, used for JWT signing |
| `REFRESH_SECRET` | Yes | Min 32 chars, different from JWT_SECRET |
| `ADMIN_API_KEY` | Yes | Separate key for admin endpoints |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `REDIS_URL` | No | Falls back to in-memory queue/cache |
| `DISPATCH_APPS` | Yes | Comma-separated app names |
| `DISPATCH_<APP>_API_KEY` | Yes | API key per app (e.g., `DISPATCH_DEFAULT_API_KEY`) |
| `DISPATCH_<APP>_DISCORD_WEBHOOK` | No | Discord webhook URL |
| `DISPATCH_<APP>_SLACK_WEBHOOK` | No | Slack webhook URL |

See `.env.example` for the full list.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, commit format, and PR checklist.

## Security

See [SECURITY.md](SECURITY.md) for vulnerability reporting and security measures.

## Author

**Mahmoud Assaf** — [GitHub](https://github.com/MahmoudAssaf47)

## License

[MIT](LICENSE)
