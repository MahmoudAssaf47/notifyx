import express from "express";
import crypto from 'crypto';
import { broker, createLogger, connectDB, AuditLog, SecurityEvent, AuthEvent, runWithCorrelation } from "@notifyx/shared";
import * as dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const logger = createLogger("AuditService");

const app = express();
const port = process.env.AUDIT_PORT ?? '3005';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  logger.error("JWT_SECRET environment variable is required. Application cannot start without it.");
  process.exit(1);
}

const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: "Unauthorized", message: "Missing or invalid token" });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET ?? '') as { userId: string; role: string; email: string };
    if (payload.role !== 'admin') {
      res.status(403).json({ success: false, error: "Forbidden", message: "Admin role required" });
      return;
    }
    next();
  } catch {
    res.status(401).json({ success: false, error: "Unauthorized", message: "Token expired or invalid" });
  }
};

app.use(express.json());

app.use((req, res, next) => {
  const correlationId = (req.get("X-Correlation-ID") || crypto.randomUUID()) as string;
  runWithCorrelation(correlationId, () => {
    next();
  });
});

const startServer = async () => {
  if (!process.env.MONGODB_URI) {
    logger.error("MONGODB_URI is not set");
    process.exit(1);
  }

  await connectDB(process.env.MONGODB_URI);

  broker.subscribe("notification.delivered", async (payloadStr) => {
    const payload = JSON.parse(payloadStr);
    const { appName, channel, ipAddress, response } = payload;

    await AuditLog.create({
      app: appName,
      channel,
      status: "sent",
      body: payload.body,
      senderName: payload.sender?.name,
      senderEmail: payload.sender?.email,
      subject: payload.subject,
      metadata: payload.metadata ? JSON.stringify(payload.metadata) : undefined,
      ipAddress,
      response,
    });
    logger.info(`Audit logged: Notification delivered for ${appName}`);
  });

  broker.subscribe("notification.failed", async (payloadStr) => {
    const payload = JSON.parse(payloadStr);
    const { appName, channel, ipAddress, error } = payload;

    await AuditLog.create({
      app: appName,
      channel,
      status: "failed",
      body: payload.body,
      senderName: payload.sender?.name,
      senderEmail: payload.sender?.email,
      subject: payload.subject,
      metadata: payload.metadata ? JSON.stringify(payload.metadata) : undefined,
      ipAddress,
      error,
    });
    logger.info(`Audit logged: Notification failed for ${appName}`);
  });

  broker.subscribe("notification.spam", async (payloadStr) => {
    const payload = JSON.parse(payloadStr);
    const { appName, reason, ipAddress } = payload;

    await AuditLog.create({
      app: appName,
      channel: payload.channel,
      status: "spam",
      body: payload.body,
      senderName: payload.sender?.name,
      senderEmail: payload.sender?.email,
      subject: payload.subject,
      metadata: payload.metadata ? JSON.stringify(payload.metadata) : undefined,
      ipAddress,
      reason,
    });
    logger.info(`Audit logged: Spam blocked for ${appName}`);
  });

  broker.subscribe("audit.security", async (payloadStr) => {
    const payload = JSON.parse(payloadStr);
    await SecurityEvent.create(payload);
    logger.info(`Security event logged for ${payload.app}`);
  });

  broker.subscribe("audit.auth", async (payloadStr) => {
    const payload = JSON.parse(payloadStr);
    await AuthEvent.create(payload);
    logger.info(`Auth event logged for user ${payload.userId}`);
  });

  app.get("/audit", requireAdmin, async (req, res) => {
    try {
      const { user, application, channel, status, startDate, endDate, limit = 50, offset = 0 } = req.query;

      const filter: Record<string, unknown> = {};
      if (user) filter.user = user;
      if (application) filter.app = application;
      if (channel) filter.channel = channel;
      if (status) filter.status = status;
      if (startDate || endDate) {
        const dateFilter: Record<string, Date> = {};
        if (startDate) dateFilter.$gte = new Date(startDate as string);
        if (endDate) dateFilter.$lte = new Date(endDate as string);
        filter.createdAt = dateFilter;
      }

      const total = await AuditLog.countDocuments(filter);
      const logs = await AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(Number(offset))
        .limit(Number(limit))
        .lean();

      res.json({
        success: true,
        total,
        limit: Number(limit),
        offset: Number(offset),
        data: logs
      });
    } catch (error) {
      logger.error("Failed to fetch audit logs", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  });

  app.get("/audit/:id", requireAdmin, async (req, res) => {
    try {
      const log = await AuditLog.findById(req.params.id).lean();
      if (!log) {
        return res.status(404).json({ success: false, error: "Audit log not found" });
      }
      return res.json({ success: true, data: log });
    } catch (err) {
      logger.error(`Failed to fetch audit log ${req.params.id}`, { error: err instanceof Error ? err.message : String(err) });
      return res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  });

  app.get("/status", requireAdmin, async (req, res) => {
    try {
      const totalMessages = await AuditLog.countDocuments();
      const apps = await AuditLog.distinct("app");
      
      res.json({
        success: true,
        uptime: process.uptime(),
        stats: {
          totalMessages,
          apps
        }
      });
    } catch {
      res.status(500).json({ success: false, error: "Failed to fetch stats" });
    }
  });

  broker.startPolling();

  const server = app.listen(port, () => {
    logger.info(`Audit Service listening on port ${port}`);
  });

  const shutdown = async () => {
    logger.info("Shutting down Audit Service...");
    broker.stopPolling();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    process.exit(0);
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
};

startServer().catch(err => {
  logger.error("Fatal startup error", { error: err.message });
  process.exit(1);
});
