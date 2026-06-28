# Changelog

## [1.0.0] — 2026-06-28

### Added
- Initial release of NotifyX
- Multi-channel delivery: Discord, Slack, Telegram, Email, Webhooks
- JWT authentication with refresh token rotation
- API key management with scoped permissions
- Spam detection and payload validation
- Audit logging for all auth and delivery events
- Analytics and metrics per application and channel
- Docker Compose deployment (7 microservices)
- Correlation ID tracking across services
- Rate limiting (IP + API key)
- Circuit breaker pattern for external channels
- Structured JSON logging with correlation IDs

### Security
- Argon2id password hashing (tuned parameters)
- AES-256-CBC encryption for SMTP credentials
- SHA-256 hashing for API keys
- Helmet security headers
- JWT secrets validated at startup (no fallback)
- Admin endpoints protected by JWT + RBAC
