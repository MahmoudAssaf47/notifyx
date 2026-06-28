import { broker, createLogger, loadAppsConfigFromEnv, NotifyRequest } from "@notifyx/shared";
import { sendDiscord, sendSlack, sendTelegram, sendWebhook, sendEmail } from "./channels.js";

const logger = createLogger("DeliveryWorker");

interface CircuitState {
  failures: number;
  lastFailure: number;
  state: "closed" | "open" | "half-open";
}

const circuits = new Map<string, CircuitState>();
const FAILURE_THRESHOLD = 5;
const RESET_TIMEOUT = 60000;

function getCircuitState(channel: string): CircuitState {
  let circuit = circuits.get(channel);
  if (!circuit) {
    circuit = { failures: 0, lastFailure: 0, state: "closed" };
    circuits.set(channel, circuit);
  }
  return circuit;
}

function recordFailure(channel: string): void {
  const circuit = getCircuitState(channel);
  circuit.failures++;
  circuit.lastFailure = Date.now();
  if (circuit.failures >= FAILURE_THRESHOLD) {
    circuit.state = "open";
    logger.warn(`Circuit opened for channel: ${channel}`);
  }
}

function recordSuccess(channel: string): void {
  const circuit = getCircuitState(channel);
  circuit.failures = 0;
  circuit.state = "closed";
}

function isCircuitOpen(channel: string): boolean {
  const circuit = getCircuitState(channel);
  if (circuit.state === "closed") return false;
  if (circuit.state === "open" && Date.now() - circuit.lastFailure > RESET_TIMEOUT) {
    circuit.state = "half-open";
    return false;
  }
  return circuit.state === "open";
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

      if (isCircuitOpen(payload.channel)) {
        logger.error(`Circuit is open for channel ${payload.channel}, rejecting delivery`);
        await this.broker.publish("notification.failed", {
          appName,
          channel: payload.channel,
          payload,
          ipAddress,
          error: `Circuit breaker open for channel: ${payload.channel}`,
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
        recordFailure(payload.channel);
        throw err;
      }

      if (result.success) {
        recordSuccess(payload.channel);
        logger.info(`Successfully delivered message to ${payload.channel} for ${appName}`);
        await this.broker.publish("notification.delivered", {
          appName,
          channel: payload.channel,
          payload,
          ipAddress,
          response: result.response,
        });
      } else {
        recordFailure(payload.channel);
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
