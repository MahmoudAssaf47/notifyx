# NotifyX Database Documentation

## Collections

### `users`
- **Purpose**: User accounts
- **Indexes**: `email` (unique)
- **TTL**: None

### `apikeys`
- **Purpose**: API keys for application access
- **Indexes**: `keyHash` (unique), `userId`
- **TTL**: None

### `messages`
- **Purpose**: Notification delivery history
- **Indexes**: `app`, `status`, compound `{app, status}`, `created_at`
- **TTL**: 30 days

### `audit_logs`
- **Purpose**: Full audit trail
- **Indexes**: `app`, `channel`, `status`, `user`, compound `{app, status, created_at}`
- **TTL**: 90 days

### `analytics`
- **Purpose**: Per-application aggregated statistics
- **Indexes**: `app` (unique)
- **TTL**: None

### `metrics`
- **Purpose**: Time-series metric data
- **Indexes**: `name`, `app`, `channel`, `timestamp`
- **TTL**: 7 days

### `security_events`
- **Purpose**: Security incident records
- **Indexes**: `app`, `eventType`, `severity`
- **TTL**: 1 year

### `auth_events`
- **Purpose**: Authentication event log
- **Indexes**: `userId`, `app`, `eventType`, `status`
- **TTL**: 1 year

### `app_configs`
- **Purpose**: Application configuration storage
- **Indexes**: `appName` (unique), `apiKey` (unique)
- **TTL**: None

## Indexes

Ensure optimal query performance with compound indexes on frequent query patterns. Add TTL indexes to prevent unbounded collection growth.
