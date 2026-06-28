import {
  broker,
  createLogger,
  loadAppsConfigFromEnv,
  runWithCorrelation,
} from "@notifyx/shared";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import { checkSpam, validateNotifyRequest } from "./validator.js";

const logger = createLogger("NotificationService");

export const startNotificationService = (port: number): Promise<void> => {
  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  const appsConfig = loadAppsConfigFromEnv();

  app.post("/api/notify", (req, res) => {
    const correlationId = (req.get("X-Correlation-ID") || "unknown") as string;

    runWithCorrelation(correlationId, async () => {
      try {
        const apiKey = req.get("x-api-key");
        const appEntry = Object.entries(appsConfig).find(
          ([, cfg]) => cfg.apiKey === apiKey,
        );
        if (!appEntry) {
          res.status(401).json({ success: false, error: "UNAUTHORIZED" });
          return;
        }
        const appName = appEntry[0];

        const payload = validateNotifyRequest(req.body);
        const spamCheck = checkSpam(payload.body);

        if (spamCheck.isSpam) {
          logger.warn(`Spam detected in message for app: ${appName}`, {
            reason: spamCheck.reason,
          });
          await broker.publish("notification.spam", {
            appName,
            payload,
            reason: spamCheck.reason,
            ipAddress: req.ip,
          });

          res.status(403).json({
            success: false,
            error: "SPAM_DETECTED",
            message: spamCheck.reason,
            timestamp: new Date().toISOString(),
          });
          return;
        }

        const eventId = await broker.publish("notification.received", {
          appName,
          payload,
          ipAddress: req.ip,
        });

        logger.info(`Notification queued for app: ${appName}`, { eventId });

        res.json({
          success: true,
          messageId: eventId,
          channel: payload.channel,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Validation failed";
        logger.warn(`Failed notification submission: ${errorMsg}`);
        res.status(400).json({
          success: false,
          error: "VALIDATION_ERROR",
          message: errorMsg,
          timestamp: new Date().toISOString(),
        });
      }
    });
  });

  return new Promise((resolve, reject) => {
    app.listen(port, () => {
      logger.info(`Notification Service listening on port ${port}`);
      resolve();
    }).on('error', reject);
  });
};

const port = parseInt(process.env.NOTIFICATION_PORT ?? '3002', 10);
startNotificationService(port).catch(err => {
  logger.error("Fatal startup error", { error: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});
