# Changelog

## [1.0.0] - 2026

### Initial Release

#### Features
- Multi-channel notification delivery (Discord, Slack, Telegram, Webhook, Email)
- JWT-based authentication with refresh tokens
- API key management for application access
- Spam detection with keyword filtering and script injection prevention
- Audit logging for all notification delivery events
- Analytics and metrics tracking per application and channel
- Admin service for application configuration management
- Rate limiting at the API gateway level
- Correlation ID tracking across microservices
- In-memory queue with optional Redis/BullMQ fallback

#### Architecture
- Monorepo with Turborepo
- 7 microservices + 1 shared package
- Event-driven communication via pub/sub queue
- MongoDB for persistent storage
- Redis for caching and queue operations

#### Security
- Argon2id password hashing
- JWT with configurable expiration
- Helmet security headers
- CORS configuration
- Environment-based configuration
