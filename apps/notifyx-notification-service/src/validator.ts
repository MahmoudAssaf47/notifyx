import type { NotifyRequest, SpamCheckResult } from "@notifyx/shared";

const SPAM_KEYWORDS = [
  "viagra", "cialis", "casino", "gambling", "crypto", "bitcoin",
  "buy now", "discount", "free offer", "make money", "investment"
];

export const checkSpam = (body: string): SpamCheckResult => {
  const lowercaseBody = body.toLowerCase();
  for (const keyword of SPAM_KEYWORDS) {
    if (lowercaseBody.includes(keyword)) {
      return {
        isSpam: true,
        category: "content_filter",
        reason: `Contains forbidden keyword: ${keyword}`,
      };
    }
  }

  if (/<script/i.test(body) || /javascript:/i.test(body)) {
    return {
      isSpam: true,
      category: "security",
      reason: "Script injection detected",
    };
  }

  return { isSpam: false };
};

const VALID_CHANNELS = ["discord", "slack", "telegram", "webhook", "email"] as const;

export const validateNotifyRequest = (body: unknown): NotifyRequest => {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid request body");
  }

  const candidate = body as Record<string, unknown>;

  if (!VALID_CHANNELS.includes(candidate.channel as typeof VALID_CHANNELS[number])) {
    throw new Error(`Invalid channel. Supported: ${VALID_CHANNELS.join(", ")}`);
  }

  if (typeof candidate.body !== "string" || candidate.body.trim().length === 0) {
    throw new Error("Body is required and must be a non-empty string");
  }

  const result: NotifyRequest = {
    channel: candidate.channel as NotifyRequest["channel"],
    body: candidate.body,
  };

  if (candidate.subject !== undefined && typeof candidate.subject !== "string") {
    throw new Error("Subject must be a string");
  }
  if (typeof candidate.subject === "string") result.subject = candidate.subject;

  if (candidate.to !== undefined && typeof candidate.to !== "string") {
    throw new Error("Recipient (to) must be a string");
  }
  if (typeof candidate.to === "string") result.to = candidate.to;

  if (candidate.cc !== undefined && typeof candidate.cc !== "string") {
    throw new Error("CC must be a string");
  }
  if (typeof candidate.cc === "string") result.cc = candidate.cc;

  if (candidate.bcc !== undefined && typeof candidate.bcc !== "string") {
    throw new Error("BCC must be a string");
  }
  if (typeof candidate.bcc === "string") result.bcc = candidate.bcc;

  if (candidate.channel === "email" && !candidate.to && !candidate.cc) {
    throw new Error("Email channel requires at least one recipient (to or cc)");
  }

  if (candidate.sender !== undefined) {
    if (typeof candidate.sender !== "object" || candidate.sender === null) {
      throw new Error("Sender must be an object");
    }
    const s = candidate.sender as Record<string, unknown>;
    result.sender = {};
    if (s.name !== undefined && typeof s.name === "string") result.sender.name = s.name;
    if (s.email !== undefined && typeof s.email === "string") result.sender.email = s.email;
  }

  if (candidate.metadata !== undefined) {
    if (typeof candidate.metadata !== "object" || candidate.metadata === null) {
      throw new Error("Metadata must be an object");
    }
    const meta = candidate.metadata as Record<string, unknown>;
    const cleanMeta: Record<string, string | number | boolean> = {};
    for (const [key, val] of Object.entries(meta)) {
      if (typeof val !== "string" && typeof val !== "number" && typeof val !== "boolean") {
        throw new Error(`Metadata key '${key}' must be string, number, or boolean`);
      }
      cleanMeta[key] = val;
    }
    result.metadata = cleanMeta;
  }

  return result;
};

