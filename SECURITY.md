# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x | Yes |
| < 1.0 | No |

## Reporting a Vulnerability

**Email:** mahmoudassaf952@gmail.com

Or use [GitHub Security Advisories](https://github.com/MahmoudAssaf47/notifyx/security/advisories/new) for private reporting.

Do NOT open a public issue for security vulnerabilities.

### Response Timeline

- **48 hours** — acknowledgment
- **7 days** — assessment and initial fix for critical issues
- **30 days** — fix or mitigation for non-critical issues

## Security Measures

### Authentication
- **Passwords:** Argon2id (memoryCost: 65536, timeCost: 3, parallelism: 4)
- **JWT:** Short-lived access tokens (15m), refresh rotation (7d)
- **API Keys:** SHA-256 hashed, shown once at creation
- **Admin:** Separate `ADMIN_API_KEY` isolated from user auth

### Data Protection
- SMTP credentials encrypted at rest (AES-256-CBC)
- All MongoDB queries use Mongoose (no string interpolation)
- Rate limiting: IP-based (1000/15min) + API key-based (200/min)
- Helmet security headers on gateway

### Audit
- All auth events logged (login, register, token refresh, API key create/revoke)
- All delivery attempts logged (success, failure, spam)
- Correlation IDs propagated across all services

## Hall of Fame

Researchers who report valid vulnerabilities will be credited here (with permission).

## License

This security policy is part of NotifyX, licensed under MIT.
