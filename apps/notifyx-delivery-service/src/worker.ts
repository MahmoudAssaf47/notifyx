import { broker, createLogger, loadAppsConfigFromEnv, NotifyRequest } from "@notifyx/shared";
import { sendDiscord, sendSlack, sendTelegram, sendWebhook, sendEmail } from "./channels.js";

const logger = createLogger("DeliveryWorker");

const channels = new Map<string, { fails: number; lastFail: number; open: boolean }>();
const MAX_FAILS = 5;
const COOLDOWN = 60000;

function markFail(ch: string) {
  const c = channels.get(ch) ?? { fails: 0, lastFail: 0, open: false };
  c.fails++;
  c.lastFail = Date.now();
  if (c.fails >= MAX_FAILS) c.open = true;
  channels.set(ch, c);
}

function markOk(ch: string) {
  channels.set(ch, { fails: 0, lastFail: 0, open: false });
}

function isBlocked(ch: string): boolean {
  const c = channels.get(ch);
  if (!c || !c.open) return false;
  if (Date.now() - c.lastFail > COOLDOWN) {
    c.open = false;
    return false;
  }
  return true;
}

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

      if (isBlocked(payload.channel)) {
        logger.error(`Channel ${payload.channel} is down, skipping delivery`);
        await this.broker.publish("notification.failed", {
          appName,
          channel: payload.channel,
          payload,
          ipAddress,
          error: `Channel ${payload.channel} is down`,
        });
        return;
      }

      const appConfig = this.appsConfig[appName];
      if (!appConfig) {
        throw new Error(`Config for app '${appName}' not found`);
      }

      let result;
      try {
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
      } catch (err) {
        markFail(payload.channel);
        throw err;
      }

      if (result.success) {
        markOk(payload.channel);
        logger.info(`Successfully delivered message to ${payload.channel} for ${appName}`);
        await this.broker.publish("notification.delivered", {
          appName,
          channel: payload.channel,
          payload,
          ipAddress,
          response: result.response,
        });
      } else {
        markFail(payload.channel);
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
