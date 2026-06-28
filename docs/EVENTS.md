# NotifyX Event System

## Topics

| Topic | Publisher | Subscribers | Payload |
|-------|-----------|-------------|---------|
| `notification.received` | Notification Service | Delivery Worker | `{ appName, payload, ipAddress }` |
| `notification.delivered` | Delivery Worker | Audit Service, Analytics Service | `{ appName, channel, payload, ipAddress, response }` |
| `notification.failed` | Delivery Worker | Audit Service, Analytics Service | `{ appName, channel, payload, ipAddress, error }` |
| `notification.spam` | Notification Service | Audit Service, Analytics Service | `{ appName, payload, reason, ipAddress }` |
| `audit.auth` | Auth Service | Audit Service | `{ userId, eventType, status, ipAddress, userAgent }` |
| `audit.security` | (Future) | Audit Service | `{ app, eventType, ipAddress, severity, details }` |

## Delivery Guarantees

- **At-least-once** delivery via queue
- **Idempotency**: Consumers should handle duplicate events
- **Retry**: Exponential backoff (2s initial, up to 5 attempts)
- **Dead Letter**: Failed jobs are retained for inspection

## Event Contracts

```typescript
interface NotificationReceivedEvent {
  appName: string;
  payload: NotifyRequest;
  ipAddress?: string;
}

interface NotificationDeliveredEvent {
  appName: string;
  channel: string;
  payload: NotifyRequest;
  ipAddress?: string;
  response?: unknown;
}

interface NotificationFailedEvent {
  appName: string;
  channel: string;
  payload: NotifyRequest;
  ipAddress?: string;
  error?: string;
}

interface AuthEventPayload {
  userId?: string;
  eventType: 'login' | 'register' | 'token_refresh' | 'api_key_created' | 'api_key_revoked';
  status: 'success' | 'failure';
  ipAddress: string;
  userAgent?: string;
  reason?: string;
}
```

## Queue Providers

- **Redis/BullMQ**: Production. Persistent, scalable, supports multiple workers.
- **In-Memory**: Development/fallback. Single-process only, no persistence.
