# Architecture

> Enterprise multi-channel notification platform built with TypeScript microservices.

## System Overview

```mermaid
block-beta
    columns 1

    block:CLIENT
        columns 3
        ClientApp["Client Apps"]
        Dashboard["Dashboard"]
        CICD["CI/CD"]
    end

    block:GATEWAY
        columns 1
        GW["API Gateway\n:8080"]
    end

    block:PLATFORM
        columns 4
        Auth["Auth\n:3001"]
        Notif["Notification\n:3002"]
        Admin["Admin\n:3006"]
        Audit["Audit\n:3005"]
    end

    block:MESSAGING
        columns 1
        Queue["Queue\nRedis / In-Memory"]
    end

    block:WORKERS
        columns 2
        Delivery["Delivery\nWorker"]
        Analytics["Analytics\n:3004"]
    end

    block:PROVIDERS
        columns 5
        Discord["Discord"]
        Slack["Slack"]
        Telegram["Telegram"]
        Email["Email"]
        Webhook["Webhook"]
    end

    block:STORAGE
        columns 2
        MongoDB["MongoDB"]
        RedisStore["Redis"]
    end

    ClientApp --> GW
    Dashboard --> GW
    CICD --> GW

    GW --> Auth
    GW --> Notif
    GW --> Admin
    GW --> Audit

    Auth --> Queue
    Notif --> Queue
    Queue --> Delivery
    Queue --> Analytics

    Delivery --> Discord
    Delivery --> Slack
    Delivery --> Telegram
    Delivery --> Email
    Delivery --> Webhook

    Auth --> MongoDB
    Audit --> MongoDB
    Analytics --> MongoDB
    Admin --> MongoDB

    Delivery --> RedisStore
    Notif --> RedisStore
    Auth --> RedisStore
```

---

## Architecture Layers

```mermaid
block-beta
    columns 1

    block:CLIENT_LAYER["CLIENT LAYER"]:1
        columns 3
        Apps["Client Applications\nREST API Consumers"]
        Dashboard["Admin Dashboard\nFuture UI"]
        CICD["CI/CD Pipelines\nAutomated Alerts"]
    end

    block:API_LAYER["API GATEWAY LAYER"]:1
        columns 1
        GW["API Gateway\nRate Limiting - Correlation ID - CORS - Helmet"]
    end

    block:AUTHPROXY["AUTH & ROUTING LAYER"]:1
        columns 2
        Auth["Auth Service\nJWT - API Keys - RBAC"]
        Proxy["Request Router\nHTTP Proxy"]
    end

    block:PROCESSING["CORE PROCESSING LAYER"]:1
        columns 2
        Notif["Notification Service\nValidation - Spam Detection - Ingestion"]
        Admin["Admin Service\nApp Config - System Management"]
    end

    block:MESSAGING_LAYER["MESSAGING LAYER"]:1
        columns 1
        Queue["Message Broker\nBullMQ (Redis) / In-Memory Fallback\nAt-least-once delivery - Exponential Backoff"]
    end

    block:WORKER_LAYER["WORKER LAYER"]:1
        columns 2
        Delivery["Delivery Worker\nCircuit Breaker - Retry - Provider Routing"]
        Analytics["Analytics Service\nMetrics - Aggregation - Dashboards"]
    end

    block:PROVIDER_LAYER["PROVIDER LAYER"]:1
        columns 5
        Discord["Discord"]
        Slack["Slack"]
        Telegram["Telegram"]
        Email["Email"]
        Webhook["Webhook"]
    end

    block:DATA_LAYER["DATA LAYER"]:1
        columns 2
        MongoDB["MongoDB 7\nAudit Logs - Auth Events - Metrics - Analytics"]
        Redis["Redis 7\nQueue - Cache - Session"]
    end

    CLIENT_LAYER --> API_LAYER
    API_LAYER --> AUTHPROXY
    AUTHPROXY --> PROCESSING
    PROCESSING --> MESSAGING_LAYER
    MESSAGING_LAYER --> WORKER_LAYER
    WORKER_LAYER --> PROVIDER_LAYER
    WORKER_LAYER --> DATA_LAYER
    PROCESSING --> DATA_LAYER
```

---

## Simplified Architecture (README)

```mermaid
flowchart TB
    subgraph Clients
        C1["Client Apps"]
        C2["Dashboard"]
    end

    subgraph Gateway["Gateway - :8080"]
        GW["Rate Limit - Auth - Proxy"]
    end

    subgraph Core["Core Platform"]
        Auth["Auth\nJWT - API Keys"]
        Notif["Notification\nValidation - Spam Check"]
        Admin["Admin\nApp Config"]
    end

    subgraph Queue["Message Queue"]
        Q["BullMQ\nRedis / In-Memory"]
    end

    subgraph Workers["Worker Layer"]
        DL["Delivery\nCircuit Breaker - Retry"]
        AN["Analytics\nMetrics - Aggregation"]
        AU["Audit\nEvent Logging"]
    end

    subgraph Channels["Notification Channels"]
        DC["Discord"]
        SL["Slack"]
        TG["Telegram"]
        EM["Email"]
        WH["Webhook"]
    end

    subgraph Storage["Storage"]
        DB[("MongoDB")]
        RD[("Redis")]
    end

    C1 & C2 --> GW
    GW --> Auth & Notif & Admin
    Auth & Notif --> Q
    Q --> DL & AN & AU
    DL --> DC & SL & TG & EM & WH
    Auth & Admin & AN & AU --> DB
    DL & Notif --> RD
```

---

## Request Lifecycle

```mermaid
sequenceDiagram
    participant Client
    participant Gateway
    participant Notification
    participant Queue
    participant Delivery
    participant Provider

    Client->>Gateway: POST /api/notify
    Note over Gateway: Correlation ID<br/>Rate Limit (IP)<br/>Rate Limit (API Key)
    Gateway->>Notification: Proxy Request
    Note over Notification: Validate API Key<br/>Validate Payload<br/>Spam Check

    alt Spam Detected
        Notification-->>Client: 403 SPAM_DETECTED
        Notification->>Queue: notification.spam
    else Valid Request
        Notification->>Queue: notification.received
        Notification-->>Client: 200 {messageId, channel}
        Queue->>Delivery: Consume Job
        Note over Delivery: Circuit Breaker Check<br/>Route to Provider
        Delivery->>Provider: Send via Channel API
        alt Success
            Provider-->>Delivery: 200 OK
            Delivery->>Queue: notification.delivered
        else Failure
            Provider-->>Delivery: Error
            Delivery->>Queue: notification.failed
            Note over Queue: Retry (5x, exponential backoff)
        end
    end
```

---

## Notification Delivery Pipeline

```mermaid
flowchart LR
    subgraph Ingestion["1. Ingestion"]
        API["POST /api/notify"]
        Validate["Validate\nPayload"]
        Spam["Spam\nDetection"]
    end

    subgraph Queue["2. Queue"]
        MQ["Message Broker\nBullMQ"]
    end

    subgraph Processing["3. Processing"]
        CB["Circuit\nBreaker"]
        Route["Provider\nRouter"]
    end

    subgraph Delivery["4. Delivery"]
        DC["Discord"]
        SL["Slack"]
        TG["Telegram"]
        EM["Email"]
        WH["Webhook"]
    end

    subgraph Outcome["5. Outcome"]
        Success["Delivered"]
        Fail["Failed"]
        Retry["Retry\n5x, exponential"]
    end

    API --> Validate --> Spam --> MQ
    MQ --> CB --> Route
    Route --> DC & SL & TG & EM & WH
    DC & SL & TG & EM & WH --> Success & Fail
    Fail --> Retry --> MQ
    Success --> Event["Event Published"]
    Fail --> Event
    Event --> Audit["Audit Log"]
    Event --> Analytics["Metrics"]
```

---

## Service Dependency Map

```mermaid
flowchart TB
    subgraph External
        Client["Client"]
        Discord["Discord API"]
        Slack["Slack API"]
        TG["Telegram API"]
        SMTP["SMTP Server"]
        WHEndpoint["Webhook Endpoint"]
    end

    subgraph NotifyX["NotifyX Platform"]
        GW["Gateway"]
        Auth["Auth"]
        Notif["Notification"]
        Admin["Admin"]
        Audit["Audit"]
        Analytics["Analytics"]
        Delivery["Delivery"]
    end

    subgraph Infrastructure
        MongoDB[("MongoDB")]
        Redis[("Redis")]
    end

    Client -->|"HTTP"| GW
    GW -->|"Proxy"| Auth
    GW -->|"Proxy"| Notif
    GW -.->|"Proxy"| Audit

    Auth -->|"Read/Write"| MongoDB
    Auth -->|"Publish"| Redis

    Notif -->|"Publish"| Redis

    Delivery -->|"Subscribe"| Redis
    Delivery -->|"HTTP"| Discord & Slack & TG & SMTP & WHEndpoint

    Audit -->|"Subscribe"| Redis
    Audit -->|"Write"| MongoDB
    Audit -->|"Read"| MongoDB

    Analytics -->|"Subscribe"| Redis
    Analytics -->|"Write"| MongoDB
    Analytics -->|"Read"| MongoDB

    Admin -->|"Read/Write"| MongoDB
```

---

## Event Flow

```mermaid
flowchart TB
    subgraph Publishers["Event Sources"]
        AuthPub["Auth Service"]
        NotifPub["Notification Service"]
        DeliveryPub["Delivery Worker"]
    end

    subgraph Events["Event Topics"]
        E1["notification.received"]
        E2["notification.delivered"]
        E3["notification.failed"]
        E4["notification.spam"]
        E5["audit.auth"]
        E6["audit.security"]
    end

    subgraph Consumers["Event Consumers"]
        AuditConsume["Audit Service"]
        AnalyticsConsume["Analytics Service"]
        DeliveryConsume["Delivery Worker"]
    end

    subgraph Storage["Persistence"]
        AuditLog["Audit Logs"]
        AuthEvents["Auth Events"]
        Metrics["Metrics"]
        Aggregates["Aggregates"]
    end

    AuthPub --> E5
    NotifPub --> E1
    NotifPub --> E4
    DeliveryPub --> E2
    DeliveryPub --> E3

    E1 --> DeliveryConsume
    E2 --> AuditConsume & AnalyticsConsume
    E3 --> AuditConsume & AnalyticsConsume
    E4 --> AuditConsume & AnalyticsConsume
    E5 --> AuditConsume

    AuditConsume --> AuditLog & AuthEvents
    AnalyticsConsume --> Metrics & Aggregates
```

---

## Deployment Architecture

```mermaid
block-beta
    columns 1

    block:LOADBALANCER
        columns 1
        LB["Load Balancer / Reverse Proxy"]
    end

    block:CONTAINERS["Docker Compose"]
        columns 4

        block:INFRA["Infrastructure"]
            columns 1
            MongoDB[("MongoDB 7\n:27017")]
            Redis[("Redis 7\n:6379")]
        end

        block:GATEWAY_BOX["Edge"]
            columns 1
            GW["Gateway\n:8080"]
        end

        block:SERVICES["Services"]
            columns 2
            Auth["Auth\n:3001"]
            Notif["Notification\n:3002"]
            Admin["Admin\n:3006"]
            Audit["Audit\n:3005"]
            Analytics["Analytics\n:3004"]
        end

        block:WORKERS_BOX["Workers"]
            columns 1
            Delivery["Delivery\nWorker"]
        end
    end

    LB --> GW
    MongoDB --- Auth & Audit & Analytics & Admin
    Redis --- GW & Auth & Notif & Delivery & Audit & Analytics
```

---

## Architecture Review — Findings

### Identified Issues

| # | Issue | Severity | Recommendation |
|---|-------|----------|----------------|
| 1 | **Dual API key systems** — Auth Service manages `nx_` keys in MongoDB; Notification Service uses `DISPATCH_*` env vars with `ak_live_` keys | Medium | Unify to a single API key store. Use MongoDB for runtime key management. |
| 2 | **Admin Service not proxied** — Admin Service (3006) is separate from Gateway | Low | Intentional design — admin endpoints use different auth. Acceptable. |
| 3 | **`audit.security` topic never published** — Subscribed but no publisher exists | Low | Wire SecurityEvent publishing in Auth Service or Gateway. |
| 4 | **Message model unused** — Defined in shared but never written to | Low | Remove or repurpose. Currently AuditLog serves this function. |
| 5 | **Cache subsystem unused** — Exported from shared but never called | Low | Use for API key validation, rate limiting, or session caching. |
| 6 | **Duplicated auth middleware** — Audit and Analytics implement their own `requireAdmin` inline | Medium | Extract to shared package for consistency. |
| 7 | **AppConfig dual config** — MongoDB `app_configs` (Admin) and env-based config (Notification/Delivery) are not synchronized | Medium | Choose one source of truth. Recommended: MongoDB with env fallback. |
| 8 | **No integration tests** — Only 2 test files exist (8 test cases total) | High | Add integration tests for notification pipeline and auth flows. |

### Strengths

| # | Strength |
|---|----------|
| 1 | Clean event-driven architecture with well-defined topics |
| 2 | Circuit breaker pattern for provider resilience |
| 3 | Structured logging with correlation ID propagation via AsyncLocalStorage |
| 4 | Graceful fallback from Redis to in-memory queue/cache |
| 5 | Multi-stage Docker builds with Alpine images |
| 6 | Health check endpoints on all HTTP services |
| 7 | Monorepo with Turborepo for efficient builds |
| 8 | Comprehensive documentation (API, Database, Events, Deployment) |

---

## Port Reference

| Service | Port | Protocol |
|---------|------|----------|
| Gateway | 8080 | HTTP |
| Auth Service | 3001 | HTTP |
| Notification Service | 3002 | HTTP |
| Delivery Worker | — | No HTTP (queue consumer) |
| Analytics Service | 3004 | HTTP |
| Audit Service | 3005 | HTTP |
| Admin Service | 3006 | HTTP |
| MongoDB | 27017 | TCP |
| Redis | 6379 | TCP |

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Runtime | Node.js 22 | Server runtime |
| Language | TypeScript 5.4 | Type safety |
| Framework | Express 5 | HTTP framework |
| Queue | BullMQ (Redis) | Message queue with retries |
| Database | MongoDB 7 | Document store |
| Cache | Redis 7 / In-memory | Caching layer |
| Auth | JWT + argon2id | Authentication |
| Validation | Zod | Schema validation |
| Monorepo | Turborepo | Build orchestration |
| Container | Docker Compose | Deployment |
| Testing | Vitest | Unit testing |
