import { broker, createLogger, loadAppsConfigFromEnv, NotifyRequest } from "@notifyx/shared";
import { sendDiscord, sendSlack, sendTelegram, sendWebhook, sendEmail } from "./channels.js";

const logger = createLogger("DeliveryWorker");

export class DeliveryWorker {
  private broker = broker;
  private appsConfig = loadAppsConfigFromEnv();

  constructor() {
  }

  public start(): void {
    this.broker.subscribe("notification.received", async (payloadStr: string) => {
      const { appName, payload, ipAddress } = JSON.parse(payloadStr) as {
        appName: string;
        payload: NotifyRequest;
        ipAddress?: string;
      };

      logger.info(`Processing delivery for app: ${appName}, channel: ${payload.channel}`);

      const appConfig = this.appsConfig[appName];
      if (!appConfig) {
        throw new Error(`Config for app '${appName}' not found`);
      }

      let result;
      if (payload.channel === "discord") {
        if (!appConfig.channels.discord) throw new Error("Discord not configured for app");
        result = await sendDiscord(appConfig.channels.discord, payload, appName);
      } else if (payload.channel === "slack") {
        if (!appConfig.channels.slack) throw new Error("Slack not configured for app");
        result = await sendSlack(appConfig.channels.slack, payload, appName);
      } else if (payload.channel === "telegram") {
        if (!appConfig.channels.telegram) throw new Error("Telegram not configured for app");
        result = await sendTelegram(appConfig.channels.telegram, payload, appName);
      } else if (payload.channel === "webhook") {
        if (!appConfig.channels.webhook) throw new Error("Webhook not configured for app");
        result = await sendWebhook(appConfig.channels.webhook, payload, appName);
      } else if (payload.channel === "email") {
        if (!appConfig.channels.email) throw new Error("Email not configured for app");
        result = await sendEmail(appConfig.channels.email, payload, appName);
      } else {
        throw new Error(`Unsupported channel: ${payload.channel}`);
      }

      if (result.success) {
        logger.info(`Successfully delivered message to ${payload.channel} for ${appName}`);
        await this.broker.publish("notification.delivered", {
          appName,
          channel: payload.channel,
          payload,
          ipAddress,
          response: result.response,
        });
      } else {
        logger.error(`Failed to deliver message to ${payload.channel} for ${appName}: ${result.error}`);
        await this.broker.publish("notification.failed", {
          appName,
          channel: payload.channel,
          payload,
          ipAddress,
          error: result.error,
        });
      }
    });

    this.broker.startPolling();
    logger.info("Delivery Worker Service started and polling queue");
  }

  public stop(): void {
    this.broker.stopPolling();
    logger.info("Delivery Worker Service stopped");
  }
}

export const startDeliveryWorker = (): DeliveryWorker => {
  const worker = new DeliveryWorker();
  worker.start();

  const shutdown = () => {
    logger.info("Shutting down Delivery Worker...");
    worker.stop();
    process.exit(0);
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  return worker;
};


