# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest | ✅ |
| Older releases | ❌ |

---

## Reporting a Vulnerability

If you discover a security vulnerability, please **do not create a public GitHub issue**.

Instead, report it privately using one of the following methods:

- **GitHub Security Advisories**
  https://github.com/MahmoudAssaf47/notifyx/security/advisories/new

- **Email**
  mahmoudassaf952@gmail.com

Please include:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Proof of concept (if available)
- Suggested mitigation (optional)

---

## Response Timeline

| Severity | Initial Response | Status Update | Target Resolution |
|----------|------------------|---------------|-------------------|
| Critical | Within 48 hours | Within 7 days | As soon as possible |
| High | Within 72 hours | Within 7 days | As resources allow |
| Medium / Low | Within 7 days | As needed | Future release |

Response times are targets rather than guarantees.

---

## Security Practices

NotifyX follows industry security practices including:

- Password hashing using Argon2id
- Short-lived JWT access tokens
- Refresh token rotation
- Hashed API keys
- Rate limiting
- Security headers
- Audit logging
- Dependency vulnerability monitoring
- Automated dependency updates via Dependabot

Security controls may change over time as the project evolves.

---

## Scope

This policy applies to:

- API Gateway
- Authentication Service
- Notification Service
- User Service
- Database interactions
- Public APIs

Third-party services are outside the scope of this policy.

---

## Hall of Fame

Researchers who responsibly disclose valid vulnerabilities may be acknowledged here with their permission.

---

## License

This security policy is distributed under the MIT License together with NotifyX.
