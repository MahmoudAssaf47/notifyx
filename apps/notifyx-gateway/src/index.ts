import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { createLogger } from '@notifyx/shared';
import { correlationIdMiddleware } from './middleware/correlation.js';
import { globalRateLimiter, apiRateLimiter, apiKeyRateLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const logger = createLogger('Gateway');
const app = express();
const port = parseInt(process.env.GATEWAY_PORT ?? '3000', 10);

app.use(helmet());
app.use(cors());
app.use(correlationIdMiddleware);
app.use(morgan('dev'));
app.use(globalRateLimiter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'notifyx-gateway' });
});

const authServiceUrl = process.env.AUTH_SERVICE_URL ?? 'http://localhost:3001';
const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL ?? 'http://localhost:3002';
const auditServiceUrl = process.env.AUDIT_SERVICE_URL ?? 'http://localhost:3005';

app.use('/api/auth', createProxyMiddleware({
  target: authServiceUrl,
  changeOrigin: true,
  pathRewrite: { '^/api/auth': '/api/auth' }
}));

app.use('/api/notify', apiRateLimiter, apiKeyRateLimiter, createProxyMiddleware({
  target: notificationServiceUrl,
  changeOrigin: true,
  pathRewrite: { '^/api/notify': '/api/notify' }
}));

app.use('/api/logs', createProxyMiddleware({
  target: auditServiceUrl,
  changeOrigin: true,
  pathRewrite: { '^/api/logs': '/api/logs' }
}));

app.use(errorHandler);

const server = app.listen(port, () => {
  logger.info(`Gateway Service listening on port ${port}`);
});

const shutdown = async () => {
  logger.info("Shutting down Gateway...");
  await new Promise<void>((resolve) => server.close(() => resolve()));
  process.exit(0);
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
