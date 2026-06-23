import nodemailer from "nodemailer";
import crypto from "crypto";
import type {
  ChannelResult,
  DiscordChannelConfig,
  SlackChannelConfig,
  TelegramChannelConfig,
  WebhookChannelConfig,
  EmailChannelConfig,
  NotifyRequest,
} from "@notifyx/shared";

const DEFAULT_DISCORD_COLOR = 5814783;
const DEFAULT_SLACK_COLOR = "#58B9FF";
const TITLE_MAX_LENGTH = 50;

const computeTitle = (subject?: string, body?: string): string => {
  const content = body ?? "";
  if (subject) return subject;
  return content.length > TITLE_MAX_LENGTH
    ? content.slice(0, TITLE_MAX_LENGTH) + "..."
    : content;
};

export const sendDiscord = async (
  channelConfig: DiscordChannelConfig,
  payload: NotifyRequest,
  appName: string,
): Promise<ChannelResult> => {
  const { body, sender, metadata } = payload;
  const { webhookUrl, defaultEmbed } = channelConfig;
  const title = computeTitle(payload.subject, body);
  const fields: Array<{ name: string; value: string; inline: boolean }> = [];

  if (sender?.name) fields.push({ name: "From", value: sender.name, inline: true });
  if (sender?.email) fields.push({ name: "Email", value: sender.email, inline: true });
  if (metadata) {
    for (const [key, value] of Object.entries(metadata)) {
      fields.push({ name: key, value: String(value), inline: true });
    }
  }

  const embed = {
    title,
    description: body,
    color: defaultEmbed?.color ?? DEFAULT_DISCORD_COLOR,
    fields: fields.length > 0 ? fields : undefined,
    footer: { text: defaultEmbed?.footer ?? `${appName} | Dispatch` },
    timestamp: new Date().toISOString(),
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });

    if (response.ok) return { success: true };
    return { success: false, error: `Discord Webhook error: ${response.statusText}` };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
};

export const sendSlack = async (
  channelConfig: SlackChannelConfig,
  payload: NotifyRequest,
  appName: string,
): Promise<ChannelResult> => {
  const { body, sender, metadata } = payload;
  const { webhookUrl, defaultFormat } = channelConfig;
  const title = computeTitle(payload.subject, body);
  const fields: Array<{ type: string; text: string }> = [];

  if (sender?.name) fields.push({ type: "mrkdwn", text: `*From:*\n${sender.name}` });
  if (sender?.email) fields.push({ type: "mrkdwn", text: `*Email:*\n${sender.email}` });
  if (metadata) {
    for (const [key, value] of Object.entries(metadata)) {
      fields.push({ type: "mrkdwn", text: `*${key}:*\n${String(value)}` });
    }
  }

  const blocks: Array<Record<string, unknown>> = [
    { type: "header", text: { type: "plain_text", text: title, emoji: true } },
    { type: "section", text: { type: "mrkdwn", text: body } },
  ];
  if (fields.length > 0) blocks.push({ type: "section", fields });
  blocks.push({ type: "divider" });
  blocks.push({
    type: "context",
    elements: [{ type: "mrkdwn", text: `${defaultFormat?.footer ?? appName} | ${new Date().toISOString()}` }],
  });

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attachments: [{ color: defaultFormat?.color ?? DEFAULT_SLACK_COLOR, blocks }] }),
    });

    if (response.ok) return { success: true };
    return { success: false, error: `Slack Webhook error: ${response.statusText}` };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
};

export const sendTelegram = async (
  channelConfig: TelegramChannelConfig,
  payload: NotifyRequest,
  appName: string,
): Promise<ChannelResult> => {
  const { body, subject } = payload;
  const { botToken, chatId } = channelConfig;
  const title = computeTitle(subject, undefined);

  const text = `*${title}*\n\n${body}\n\n_via ${appName}_`;

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown"
      }),
    });

    if (response.ok) return { success: true };
    return { success: false, error: `Telegram error: ${response.statusText}` };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
};

export const sendWebhook = async (
  channelConfig: WebhookChannelConfig,
  payload: NotifyRequest,
  appName: string,
): Promise<ChannelResult> => {
  const { url, secret } = channelConfig;
  const body = JSON.stringify({ appName, payload, timestamp: new Date().toISOString() });
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (secret) {
    const signature = crypto.createHmac("sha256", secret).update(body).digest("hex");
    headers["X-NotifyX-Signature"] = signature;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body,
    });

    if (response.ok) return { success: true };
    return { success: false, error: `Webhook error: ${response.statusText}` };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
};

const transporterCache = new Map<string, nodemailer.Transporter>();

const getTransporter = (host: string, port: number, user: string, pass: string): nodemailer.Transporter => {
  const key = `${host}:${port}:${user}`;
  const cached = transporterCache.get(key);
  if (cached) return cached;
  const t = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  transporterCache.set(key, t);
  return t;
};

export const sendEmail = async (
  channelConfig: EmailChannelConfig,
  payload: NotifyRequest,
  appName: string,
): Promise<ChannelResult> => {
  const { smtpHost, smtpPort, smtpUser, smtpPass, fromAddress } = channelConfig;
  const title = computeTitle(payload.subject, payload.body);

  const transporter = getTransporter(smtpHost, smtpPort, smtpUser, smtpPass);

  try {
    const mailOptions: Record<string, unknown> = {
      from: `"${appName}" <${fromAddress}>`,
      subject: title,
      text: payload.body,
    };

    if (payload.to) {
      mailOptions.to = payload.to;
    }
    if (payload.cc) {
      mailOptions.cc = payload.cc;
    }
    if (payload.bcc) {
      mailOptions.bcc = payload.bcc;
    }

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
};
