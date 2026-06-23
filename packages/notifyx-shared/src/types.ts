export interface AppConfig {
  name: string;
  apiKey: string;
  rateLimit?: {
    windowMs: number;
    maxRequests: number;
  };
  channels: {
    discord?: DiscordChannelConfig;
    slack?: SlackChannelConfig;
    telegram?: TelegramChannelConfig;
    webhook?: WebhookChannelConfig;
    email?: EmailChannelConfig;
  };
}

export interface DiscordChannelConfig {
  webhookUrl: string;
  defaultEmbed?: {
    color?: number;
    footer?: string;
  };
}

export interface SlackChannelConfig {
  webhookUrl: string;
  defaultFormat?: {
    color?: string;
    footer?: string;
  };
}

export interface TelegramChannelConfig {
  botToken: string;
  chatId: string;
}

export interface WebhookChannelConfig {
  url: string;
  secret?: string;
}

export interface EmailChannelConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  fromAddress: string;
}

export interface NotifyRequest {
  channel: "discord" | "slack" | "telegram" | "webhook" | "email";
  sender?: {
    name?: string;
    email?: string;
  };
  to?: string;
  cc?: string;
  bcc?: string;
  subject?: string;
  body: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface NotifyResponse {
  success: boolean;
  messageId?: number;
  channel?: string;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface MessageRecord {
  id: string;
  app: string;
  channel: string;
  status: "pending" | "sent" | "failed" | "spam";
  sender_name: string | null;
  sender_email: string | null;
  subject: string | null;
  body: string;
  metadata: string | null;
  discord_response: string | null;
  error: string | null;
  ip_address: string | null;
  created_at: string;
  sent_at: string | null;
}

export interface ChannelResult {
  success: boolean;
  response?: unknown;
  error?: string;
}

export interface SpamCheckResult {
  isSpam: boolean;
  category?: string;
  reason?: string;
}

export interface AppsConfig {
  [appName: string]: AppConfig;
}

export interface QueueMessage {
  id: number;
  topic: string;
  payload: string; // JSON string
  attempts: number;
  maxAttempts: number;
  status: "pending" | "processing" | "completed" | "failed";
  error: string | null;
  runAt: string;
  correlationId: string;
  createdAt: string;
}

export interface LogMessageData {
  app: string;
  channel: string;
  body: string;
  senderName?: string;
  senderEmail?: string;
  subject?: string;
  metadata?: string;
  ipAddress?: string;
}

export interface GetMessagesParams {
  app?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface GetMessagesResult {
  messages: MessageRecord[];
  total: number;
}

export interface AppStats {
  totalMessages: number;
  pending: number;
  sent: number;
  failed: number;
  spam: number;
  lastMessage: string | null;
}

export interface StatsResult {
  totalMessages: number;
  apps: Record<string, AppStats>;
}

