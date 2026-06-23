import { AsyncLocalStorage } from "node:async_hooks";

export interface LogPayload {
  message: string;
  level: "info" | "warn" | "error" | "debug";
  timestamp: string;
  service: string;
  correlationId?: string;
  error?: string;
  [key: string]: unknown;
}

const telemetryStorage = new AsyncLocalStorage<{ correlationId: string }>();

export const runWithCorrelation = <T>(correlationId: string, callback: () => T): T => {
  return telemetryStorage.run({ correlationId }, callback);
};

export const getCorrelationId = (): string | undefined => {
  return telemetryStorage.getStore()?.correlationId;
};

export const createLogger = (serviceName: string) => {
  const log = (level: LogPayload["level"], message: string, context?: Record<string, unknown>) => {
    const correlationId = getCorrelationId();
    const payload: LogPayload = {
      message,
      level,
      timestamp: new Date().toISOString(),
      service: serviceName,
      correlationId,
      ...context,
    };
    
    if (context?.error instanceof Error) {
      payload.error = context.error.stack ?? context.error.message;
    }

    if (process.env.NODE_ENV !== "test") {
      process.stdout.write(JSON.stringify(payload) + "\n");
    }
  };

  return {
    info: (msg: string, ctx?: Record<string, unknown>) => log("info", msg, ctx),
    warn: (msg: string, ctx?: Record<string, unknown>) => log("warn", msg, ctx),
    error: (msg: string, ctx?: Record<string, unknown>) => log("error", msg, ctx),
    debug: (msg: string, ctx?: Record<string, unknown>) => log("debug", msg, ctx),
  };
};

export const generateTraceId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

