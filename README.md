<div align="center">

# NotifyX

### Enterprise Multi-Channel Notification Platform

[![GitHub](https://img.shields.io/badge/GitHub-MahmoudAssaf47-181717?style=for-the-badge&logo=github)](https://github.com/MahmoudAssaf47)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node.js-22.x-339933?style=for-the-badge&logo=nodedotjs)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?style=for-the-badge&logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.x-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-7.x-DC382D?style=for-the-badge&logo=redis)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker)](https://docker.com/)
[![Turborepo](https://img.shields.io/badge/Turborepo-EF4444?style=for-the-badge&logo=turborepo)](https://turbo.build/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

---

**Created by [Mahmoud Assaf](https://github.com/MahmoudAssaf47)**

</div>

## Overview

NotifyX is a **microservices-based enterprise notification platform** that provides a single integration point for sending notifications across multiple channels. Built with TypeScript and designed for scalability, it handles authentication, rate limiting, spam detection, delivery routing, audit logging, and analytics.

### Key Features

- **Multi-Channel Delivery** — Discord, Slack, Telegram, Email, and Custom Webhooks
- **JWT Authentication** — Secure access with refresh token rotation
- **API Key Management** — Scoped keys with granular permissions
- **Spam Detection** — Keyword filtering and script injection prevention
- **Audit Trail** — Complete delivery history with search and filtering
- **Analytics** — Per-application and per-channel delivery metrics
- **Event-Driven** — Async processing via pub/sub queue
- **Rate Limiting** — IP-based and API-level rate control
- **Correlation Tracking** — End-to-end request tracing across services
- **Docker Support** — Containerized deployment with Docker Compose

## Architecture

```mermaid
graph TB
  subgraph "Clients"
    A[Applications]
    B[Users]
  end

  subgraph "API Gateway :3000"
    G[Gateway]
    RL[Rate Limiter]
    CH[Correlation Handler]
  end

  subgraph "Auth :3001"
    AUTH[Auth Service]
    JWT[JWT + Argon2]
    AKM[API Key Manager]
  end

  subgraph "Notification :3002"
    NOTIF[Notification Service]
    VD[Validator]
    SPAM[Spam Detector]
  end

  subgraph "Queue"
    Q[Event Broker<br/>Memory / Redis]
  end

  subgraph "Delivery :3003"
    DEL[Delivery Worker]
    DISC[Discord]
    SLACK[Slack]
    TEL[Telegram]
    EMAIL[Email]
    WH[Webhook]
  end

  subgraph "Audit :3005"
    AUD[Audit Service]
  end

  subgraph "Analytics :3004"
    ANL[Analytics Service]
  end

  subgraph "Admin :3006"
    ADM[Admin Service]
  end

  subgraph "Storage"
    MDB[(MongoDB)]
    RDS[(Redis)]
  end

  A -->|POST /api/notify| G
  B -->|POST /api/auth| G
  G --> RL
  RL --> CH
  CH --> AUTH
  CH --> NOTIF
  NOTIF --> VD
  VD --> SPAM
  SPAM -->|spam| AUD
  SPAM --> Q
  Q --> DEL
  DEL --> DISC
  DEL --> SLACK
  DEL --> TEL
  DEL --> EMAIL
  DEL --> WH
  DEL -->|delivery result| Q
  Q --> AUD
  Q --> ANL
  AUTH --> MDB
  AUD --> MDB
  ANL --> MDB
  ADM --> MDB
  RDS -.-> Q
  RDS -.-> G
```

## Microservices

| Service | Port | Responsibility |
|---------|------|----------------|
| **Gateway** | `3000` | API gateway, rate limiting, request routing, correlation IDs |
| **Auth** | `3001` | User registration, login, JWT tokens, API key management |
| **Notification** | `3002` | Receive notifications, validate payloads, spam detection |
| **Delivery** | — | Route and send notifications to configured channels (no HTTP) |
| **Analytics** | `3004` | Track delivery success/failure metrics per app and channel |
| **Audit** | `3005` | Record all events (delivery, auth, security) with search |
| **Admin** | `3006` | Application configuration management |

## Tech Stack

| Category | Technology |
|----------|------------|
| Language | TypeScript 5.4 (strict mode) |
| Runtime | Node.js 22+ |
| Framework | Express.js 5 |
| Database | MongoDB 7 + Mongoose |
| Cache/Queue | Redis 7 / In-Memory fallback |
| Queue Client | BullMQ |
| Auth | JWT + Argon2id |
| Validation | Zod |
| Monitoring | Correlation IDs, structured JSON logging |
| Dev Tools | Turborepo, tsx, ESLint, Prettier |

## Project Structure

```
notifyx/
├── apps/
│   ├── notifyx-gateway/           # API Gateway
│   ├── notifyx-auth-service/      # Authentication Service
│   ├── notifyx-notification-service/ # Notification Handler
│   ├── notifyx-delivery-service/  # Channel Delivery Worker
│   ├── notifyx-audit-service/     # Audit Logging Service
│   ├── notifyx-analytics-service/ # Analytics & Metrics
│   └── notifyx-admin-service/     # Admin Configuration
├── packages/
│   └── notifyx-shared/            # Shared types, models, utilities
├── docker/                        # Dockerfiles per service
├── docs/                          # Documentation
├── .github/                       # CI/CD & templates
├── docker-compose.yml
└── package.json                   # Turborepo monorepo root
```

## Quick Start

### Prerequisites

- Node.js >= 22
- MongoDB >= 7 (or Docker)
- Redis >= 7 (optional, in-memory fallback available)

### Local Development

```bash
# 1. Clone
git clone https://github.com/MahmoudAssaf47/notifyx.git
cd notifyx

# 2. Install dependencies
npm install

# 3. Copy environment file
cp .env.example .env
# Edit .env with your configuration

# 4. Start all services
npm run dev
```

### Docker Deployment

```bash
# Start all services with dependencies
docker compose up -d

# Check service health
curl http://localhost:8080/health

# View logs
docker compose logs -f
```

## API Examples

### Authentication

```bash
# Register a new user
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"securepass123","name":"John Doe"}'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"securepass123"}'

# Response includes access + refresh tokens
```

### Send Notification

```bash
curl -X POST http://localhost:8080/api/notify \
  -H "Content-Type: application/json" \
  -H "x-api-key: ak_live_your_api_key_here" \
  -d '{
    "channel": "discord",
    "body": "Hello from NotifyX!",
    "subject": "Test Notification",
    "sender": {"name": "My App", "email": "app@example.com"}
  }'
```

### Create API Key

```bash
curl -X POST http://localhost:8080/api/auth/keys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_jwt_token>" \
  -d '{"appName":"MyApp","permissions":["notify:send"],"expiresInDays":30}'
```

## Event Flow

```mermaid
sequenceDiagram
    participant Client
    participant Gateway
    participant Notification
    participant Queue
    participant Delivery
    participant Audit
    participant Analytics

    Client->>Gateway: POST /api/notify
    Gateway->>Notification: Proxy request
    Notification->>Notification: Validate API key + payload
    Notification->>Notification: Check spam
    Notification->>Queue: Publish notification.received
    Notification->>Client: 202 Accepted

    Queue->>Delivery: Consume notification.received
    Delivery->>Delivery: Route to channel
    Delivery->>Discord/Slack/etc: Send message
    Delivery->>Queue: Publish notification.delivered/failed

    Queue->>Audit: Consume notification.delivered
    Audit->>MongoDB: Save audit log
    Queue->>Analytics: Consume notification.delivered
    Analytics->>MongoDB: Update metrics
```

## Environment Variables

Key variables (see `.env.example` for full list):

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | Yes | JWT signing key (min 32 chars) |
| `REFRESH_SECRET` | Yes | Refresh token signing key (min 32 chars) |
| `ADMIN_API_KEY` | Yes | Separate key for admin endpoints |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `REDIS_URL` | No | Redis URL (in-memory fallback) |

## Performance

- **API Key Lookup**: O(1) using Map-based key index
- **Database Indexes**: Indexed on common query patterns (app, channel, status, createdAt)
- **Connection Pooling**: Configured per service via Mongoose
- **Async Processing**: Queue-based delivery (non-blocking)

## Security

- **Password Hashing**: Argon2id with tuned parameters
- **JWT**: Short-lived tokens with secure secrets
- **API Keys**: Hashed with SHA-256, shown once at creation
- **SMTP Credentials**: Encrypted at rest in MongoDB (AES-256-CBC)
- **Rate Limiting**: Global and per-endpoint limits
- **Helmet**: Security headers on gateway
- **Audit Logging**: All auth events recorded
- **Admin Separation**: Dedicated admin API key

## Author

<div align="center">

### Mahmoud Assaf

**Backend Engineer | TypeScript Developer | Microservices Enthusiast | Open Source Developer**

[![GitHub](https://img.shields.io/badge/GitHub-MahmoudAssaf47-181717?style=for-the-badge&logo=github)](https://github.com/MahmoudAssaf47)

</div>

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <sub>Built with ❤️ by Mahmoud Assaf</sub>
</div>
