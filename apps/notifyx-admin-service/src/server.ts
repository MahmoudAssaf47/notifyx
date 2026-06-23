import express from "express";
import { createLogger, connectDB, AppConfigModel, Analytics, runWithCorrelation } from "@notifyx/shared";
import * as dotenv from 'dotenv';
import { randomUUID } from "crypto";

dotenv.config();

const logger = createLogger("AdminService");

const app = express();
const port = process.env.ADMIN_PORT ?? '3006';

app.use(express.json());

app.use((req, res, next) => {
  const correlationId = (req.get("X-Correlation-ID") || randomUUID()) as string;
  runWithCorrelation(correlationId, () => {
    next();
  });
});

const adminAuth = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
  const key = req.get("x-admin-key");
  const adminApiKey = process.env.ADMIN_API_KEY;
  if (!adminApiKey) {
    logger.error("ADMIN_API_KEY environment variable is not set");
    res.status(500).json({ success: false, error: "ADMIN_API_KEY not configured" });
    return;
  }
  if (!key || key !== adminApiKey) {
    res.status(401).json({ success: false, error: "UNAUTHORIZED ADMIN" });
    return;
  }
  next();
};

app.use(adminAuth);

const startServer = async () => {
  if (!process.env.MONGODB_URI) {
    logger.error("MONGODB_URI is not set");
    process.exit(1);
  }

  await connectDB(process.env.MONGODB_URI);

  app.post("/api/admin/apps", async (req, res) => {
    try {
      const { appName, apiKey, discordWebhook, discordColor, slackWebhook, telegramToken, telegramChatId, emailHost, emailPort, emailUser, emailPass, emailFrom } = req.body;

      const newApp = await AppConfigModel.create({
        appName,
        apiKey,
        discordWebhook,
        discordColor,
        slackWebhook,
        telegramToken,
        telegramChatId,
        emailHost,
        emailPort,
        emailUser,
        emailPass,
        emailFrom
      });
      res.json({ success: true, data: newApp });
    } catch (err) {
      logger.error("Failed to create app", { error: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ success: false, error: "Failed to create app" });
    }
  });

  app.get("/api/admin/analytics", async (req, res) => {
    try {
      const appsAnalytics = await Analytics.find().lean();
      const totalSent = appsAnalytics.reduce((acc, curr) => acc + curr.successCount, 0);
      const totalFailed = appsAnalytics.reduce((acc, curr) => acc + curr.failureCount, 0);
      const totalSpam = appsAnalytics.reduce((acc, curr) => acc + curr.spamCount, 0);

      res.json({
        success: true,
        data: {
          totalApps: appsAnalytics.length,
          totalSent,
          totalFailed,
          totalSpam,
          apps: appsAnalytics
        }
      });
    } catch {
      res.status(500).json({ success: false, error: "Failed to fetch analytics" });
    }
  });

  const server = app.listen(port, () => {
    logger.info(`Admin Service listening on port ${port}`);
  });

  const shutdown = async () => {
    logger.info("Shutting down Admin Service...");
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
