# Deployment Guide

## Prerequisites

- Docker 24+ and Docker Compose v2
- 4GB RAM minimum (MongoDB + Redis + 7 services)
- MongoDB 7+ (or use Docker Compose)
- Redis 7+ (optional, in-memory fallback available)

## Production Setup

### 1. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```bash
# Generate strong secrets (min 32 chars)
JWT_SECRET=$(openssl rand -hex 32)
REFRESH_SECRET=$(openssl rand -hex 32)
ADMIN_API_KEY=$(openssl rand -hex 32)

# Your app config
DISPATCH_APPS=myapp
DISPATCH_MYAPP_API_KEY=$(openssl rand -hex 32)
DISPATCH_MYAPP_DISCORD_WEBHOOK=https://discord.com/api/webhooks/...
```

### 2. Start Services

```bash
docker compose up -d
```

### 3. Verify Health

```bash
curl http://localhost:8080/health
# {"status":"ok","service":"notifyx-gateway"}
```

## Scaling

The delivery service is the only stateless worker. Scale it horizontally:

```bash
docker compose up -d --scale delivery=3
```

Other services are stateful (connected to MongoDB) — scale with caution.

## Monitoring

All services expose structured JSON logs with correlation IDs.

Health endpoints:
- Gateway: `GET /health`
- Auth: `GET /health`
- Notification: `GET /health`

Check service status:
```bash
docker compose ps
docker compose logs -f delivery
```

## Backup

MongoDB daily dump:
```bash
docker exec notifyx-mongodb mongodump --archive --gzip > backup-$(date +%Y%m%d).gz
```

Restore:
```bash
cat backup-20260628.gz | docker exec -i notifyx-mongodb mongorestore --archive --gzip
```

## Troubleshooting

| Error | Fix |
|-------|-----|
| `JWT_SECRET environment variable is required` | Add JWT_SECRET to `.env` |
| `MongoDB connection error` | Check MONGODB_URI and MongoDB is running |
| `Rate limited` | Wait for window to expire, or check API key |
| `Circuit breaker open` | External channel (Discord/Slack) is failing — check webhook URL |
