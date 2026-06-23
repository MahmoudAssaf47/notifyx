# NotifyX Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in NotifyX, please report it privately to the project owner.

**Do not disclose the vulnerability publicly until it has been addressed.**

Contact: https://github.com/MahmoudAssaf47

## Security Measures

### Authentication
- JWT-based authentication with short-lived access tokens (15m default)
- Refresh tokens for session management (7d default)
- Argon2id password hashing with strong parameters
- API key authentication for notification dispatch

### Authorization
- Role-based access control (admin, developer, viewer)
- Admin-only audit log access
- Separate admin API key from notification API keys

### Data Protection
- SMTP credentials encrypted at rest in MongoDB
- CORS configured per environment
- Helmet security headers on all HTTP responses
- Rate limiting on all public endpoints

### Infrastructure
- Graceful shutdown handlers for all services
- Health check endpoints for all services
- Correlation ID tracking across service boundaries

## OWASP Compliance

| Category | Status |
|----------|--------|
| A01: Broken Access Control | Protected |
| A02: Cryptographic Failures | Protected |
| A03: Injection | Protected (Mongoose + Zod) |
| A04: Insecure Design | Addressed |
| A05: Security Misconfiguration | Addressed |
| A06: Vulnerable Components | Review regularly |
| A07: Authentication Failures | Protected |
| A08: Data Integrity | Protected |
| A09: Logging & Monitoring | Implemented |
| A10: SSRF | Mitigated |
