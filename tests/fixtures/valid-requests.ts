import type { NotifyRequest } from "@notifyx/shared";

export const validDiscordRequest: NotifyRequest = {
  channel: "discord",
  body: "Hello from NotifyX",
  subject: "Test",
  sender: { name: "Test User", email: "test@example.com" },
};

export const validEmailRequest: NotifyRequest = {
  channel: "email",
  body: "Email body text",
  subject: "Email Subject",
  to: "recipient@example.com",
  sender: { name: "Sender", email: "sender@example.com" },
};

export const invalidRequestMissingBody: Record<string, unknown> = {
  channel: "discord",
};

export const invalidRequestBadChannel: Record<string, unknown> = {
  channel: "sms",
  body: "test",
};
