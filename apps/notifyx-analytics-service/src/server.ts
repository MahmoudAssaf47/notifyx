import express from "express";
import { broker, createLogger, connectDB, Analytics, Metric, runWithCorrelation } from "@notifyx/shared";
import * as dotenv from 'dotenv';
import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';

dotenv.config();

const logger = createLogger("AnalyticsService");

const app = express();
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
const port = process.env.ANALYTICS_PORT ?? '3004';

app.use(express.json());

app.use((req, res, next) => {
  const correlationId = (req.get("X-Correlation-ID") || randomUUID()) as string;
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

  const incrementAnalytics = async (appName: string, field: 'successCount' | 'failureCount' | 'spamCount') => {
    await Analytics.findOneAndUpdate(
      { app: appName },
      { 
        $inc: { totalMessages: 1, [field]: 1 },
        $set: { lastActive: new Date() }
      },
      { upsert: true, new: true }
    );
  };

  const recordMetric = async (name: string, value: number, appName?: string, channel?: string) => {
    await Metric.create({ name, value, app: appName, channel });
  };

  broker.subscribe("notification.delivered", async (payloadStr) => {
    const { appName, channel } = JSON.parse(payloadStr);
    await incrementAnalytics(appName, "successCount");
    await recordMetric("notification_delivered", 1, appName, channel);
  });

  broker.subscribe("notification.failed", async (payloadStr) => {
    const { appName, channel } = JSON.parse(payloadStr);
    await incrementAnalytics(appName, "failureCount");
    await recordMetric("notification_failed", 1, appName, channel);
  });

  broker.subscribe("notification.spam", async (payloadStr) => {
    const { appName, channel } = JSON.parse(payloadStr);
    await incrementAnalytics(appName, "spamCount");
    await recordMetric("notification_spam", 1, appName, channel);
  });

  app.get("/analytics", requireAdmin, async (req, res) => {
    try {
      const stats = await Analytics.find().sort({ totalMessages: -1 }).lean();
      res.json({ success: true, data: stats });
    } catch (error) {
      logger.error("Failed to fetch analytics", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  });

  app.get("/analytics/applications", requireAdmin, async (req, res) => {
    try {
      const { app } = req.query;
      const filter = app ? { app: String(app) } : {};
      const stats = await Analytics.find(filter).lean();
      res.json({ success: true, data: stats });
    } catch {
      res.status(500).json({ success: false, error: "Failed to fetch application analytics" });
    }
  });

  app.get("/analytics/channels", requireAdmin, async (req, res) => {
    try {
      const metrics = await Metric.aggregate([
        { $match: { name: { $in: ["notification_delivered", "notification_failed"] } } },
        { 
          $group: { 
            _id: "$channel", 
            delivered: { $sum: { $cond: [{ $eq: ["$name", "notification_delivered"] }, "$value", 0] } },
            failed: { $sum: { $cond: [{ $eq: ["$name", "notification_failed"] }, "$value", 0] } }
          } 
        }
      ]);
      res.json({ success: true, data: metrics });
    } catch {
      res.status(500).json({ success: false, error: "Failed to fetch channel metrics" });
    }
  });

  broker.startPolling();

  const server = app.listen(port, () => {
    logger.info(`Analytics Service listening on port ${port}`);
  });

  const shutdown = async () => {
    logger.info("Shutting down Analytics Service...");
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
