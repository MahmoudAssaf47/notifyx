<div align="center">

# NotifyX

**Enterprise multi-channel notification platform. Send to Discord, Slack, Telegram, Email, and Webhooks from a single API.**

[![Build](https://img.shields.io/badge/build-passing-brightgreen?style=flat-square)]()
[![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-orange?style=flat-square)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=flat-square&logo=typescript)]()
[![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-brightgreen?style=flat-square)](CONTRIBUTING.md)
[![Discussions](https://img.shields.io/github/discussions/MahmoudAssaf47/notifyx?style=flat-square)](https://github.com/MahmoudAssaf47/notifyx/discussions)

</div>

---

## Why NotifyX?

Every app needs to send notifications — alerts, transactional emails, team updates. But each channel (Discord, Slack, Telegram, Email) has its own API, retry logic, and quirks.

**NotifyX solves this** by sitting between your application and all notification channels. One API, one request, everything delivered.

| Problem | NotifyX Solution |
|---------|-----------------|
| Different API for each channel | Single unified API |
| No retry or delivery guarantees | Built-in retry with dead letter queue |
| No audit trail | Every notification logged and queryable |
| Hard to scale notification sending | Microservices architecture with queue-based delivery |
| No rate limiting per client | Per-key rate limiting built-in |
| Missing observability | Structured logging + analytics service |

## Feature Comparison

| Feature | NotifyX | Novu | Knock | Custom Solution |
|---------|---------|------|-------|-----------------|
| **Self-hosted** | Yes | Yes (limited) | No | Yes |
| **Multi-channel** | Discord, Slack, Telegram, Email, Webhook | 30+ channels | 20+ channels | Varies |
| **Microservices** | 7 independent services | Monolith | SaaS | Varies |
| **Queue-based delivery** | BullMQ | In-house | In-house | Manual |
| **Audit trail** | Built-in | Yes | Yes | Manual |
| **Analytics** | Built-in | Yes | Yes | Manual |
| **Rate limiting** | Per API key | Per tenant | Per tenant | Manual |
| **Template system** | Planned (v1.1) | Yes | Yes | Manual |
| **Cost** | Free (MIT) | Free tier + paid | Paid | Free (your time) |

> **NotifyX is for teams that need full control over their notification infrastructure without building from scratch.**

## Quick Start

### Option 1: Docker (recommended)

```bash
git clone https://github.com/MahmoudAssaf47/notifyx.git && cd notifyx
cp .env.example .env   # edit with your secrets
docker compose up -d
```

Gateway runs on `http://localhost:8080`.

### Option 2: Local development

```bash
git clone https://github.com/MahmoudAssaf47/notifyx.git && cd notifyx
npm install
cp .env.example .env   # edit with your secrets
npm run dev
```

**First time?** See the full [setup guide](docs/DEPLOYMENT.md) for environment variables and database setup.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Application                       │
│                     (Your app, CI/CD, etc.)                     │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP Request
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Gateway (:8080)                              │
│            Auth · Rate Limiting · Request Routing                │
└──────────────────────────┬──────────────────────────────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
┌──────────────────┐ ┌───────────┐ ┌──────────────┐
│    Notification   │ │   Audit   │ │   Analytics  │
│     Service       │ │  Service  │ │   Service    │
│                   │ │           │ │              │
│ Spam Check        │ │ Log all   │ │ Metrics &    │
│ Template Render   │ │ events    │ │ Dashboards   │
│ Queue Message     │ │           │ │              │
└────────┬─────────┘ └───────────┘ └──────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│          Queue (Redis / In-Memory)        │
└──────────────────┬───────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────┐
│          Delivery Worker                  │
│    Route → Channel → Retry → Log         │
└──────┬─────┬──────┬──────┬──────┬───────┘
       │     │      │      │      │
       ▼     ▼      ▼      ▼      ▼
   Discord Slack Telegram Email Webhook
```

**7 Microservices:**
| Service | Role |
|---------|------|
| **Gateway** | API entry point, auth, routing |
| **Auth** | JWT tokens, API keys, user management |
| **Notification** | Processing, spam checks, templating |
| **Delivery** | Channel routing, retries, delivery |
| **Audit** | Event logging, compliance |
| **Analytics** | Metrics, dashboards, insights |
| **Admin** | App management, configuration |

All services communicate via pub/sub queue (Redis or in-memory fallback).

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

### Create an API key

```bash
curl -X POST http://localhost:8080/api/auth/keys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"appName":"my-app","permissions":["notify:send"]}'
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

### Supported channels

| Channel | Field | Notes |
|---------|-------|-------|
| Discord | `"channel": "discord"` | Via webhook URL |
| Slack | `"channel": "slack"` | Via webhook URL |
| Telegram | `"channel": "telegram"` | Via bot token |
| Email | `"channel": "email"` | Via SMTP |
| Webhook | `"channel": "webhook"` | Any HTTP endpoint |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | Yes | Min 32 chars, used for JWT signing |
| `REFRESH_SECRET` | Yes | Min 32 chars, different from JWT_SECRET |
| `ADMIN_API_KEY` | Yes | Separate key for admin endpoints |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `REDIS_URL` | No | Falls back to in-memory queue/cache |
| `DISPATCH_APPS` | Yes | Comma-separated app names |
| `DISPATCH_<APP>_API_KEY` | Yes | API key per app |
| `DISPATCH_<APP>_DISCORD_WEBHOOK` | No | Discord webhook URL |
| `DISPATCH_<APP>_SLACK_WEBHOOK` | No | Slack webhook URL |

See `.env.example` for the full list. Full variable reference: [DATABASE.md](docs/DATABASE.md)

## Documentation

- [API Reference](docs/API_REFERENCE.md)
- [Database Schema](docs/DATABASE.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Event System](docs/EVENTS.md)
- [Docker Guide](docs/DOCKER.md) — *coming soon*
- [Contributing Guide](CONTRIBUTING.md)

## Contributing

We love contributions! Whether it is a bug fix, new feature, or documentation improvement — every contribution matters.

**[Read the Contributing Guide →](CONTRIBUTING.md)**

### Good first issues

Looking for a place to start? These issues are perfect for newcomers:

- [Enhance health check endpoints](https://github.com/MahmoudAssaf47/notifyx/issues/15)
- [Add CORS configuration](https://github.com/MahmoudAssaf47/notifyx/issues/13)
- [Write API examples documentation](https://github.com/MahmoudAssaf47/notifyx/issues/16)
- [Improve Docker documentation](https://github.com/MahmoudAssaf47/notifyx/issues/9)
- [Add ntfy channel provider](https://github.com/MahmoudAssaf47/notifyx/issues/5)
- [Add structured JSON logging](https://github.com/MahmoudAssaf47/notifyx/issues/4)

Browse all [good first issues →](https://github.com/MahmoudAssaf47/notifyx/labels/good%20first%20issue) · [help wanted →](https://github.com/MahmoudAssaf47/notifyx/labels/help%20wanted)

### Community

- [Discussions](https://github.com/MahmoudAssaf47/notifyx/discussions) — Ask questions, share ideas
- [Issues](https://github.com/MahmoudAssaf47/notifyx/issues) — Report bugs, request features

## Roadmap

| Phase | Features |
|-------|----------|
| **v1.1** | Notification templates, scheduled sends, rate limiting, email verification |
| **v2.0** | Multi-tenant, SMS/push channels, OpenTelemetry, Kubernetes |
| **Later** | Event sourcing, admin dashboard, plugin system, WebSocket |

See the full [Roadmap →](ROADMAP.md)

## AI Transparency

NotifyX is developed with the assistance of AI tools to improve productivity, documentation, issue management, and code quality. All generated content is reviewed, validated, and approved by the maintainer before being merged. Architectural decisions, code reviews, and final approvals remain under the project maintainer's responsibility.

## Security

See [SECURITY.md](SECURITY.md) for vulnerability reporting and security measures.

## Author

**Mahmoud Assaf** — [GitHub](https://github.com/MahmoudAssaf47)

## License

[MIT](LICENSE)
