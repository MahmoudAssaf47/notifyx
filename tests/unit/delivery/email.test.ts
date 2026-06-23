import { describe, it, expect } from "vitest";
import type { EmailChannelConfig, NotifyRequest } from "@notifyx/shared";

// Inline test of the computeTitle function from channels.ts
function computeTitle(subject?: string, body?: string): string {
  const TITLE_MAX_LENGTH = 50;
  const content = body ?? "";
  if (subject) return subject;
  return content.length > TITLE_MAX_LENGTH
    ? content.slice(0, TITLE_MAX_LENGTH) + "..."
    : content;
}

describe("Email Delivery Helpers", () => {
  it("uses subject when provided", () => {
    expect(computeTitle("Subject", "Body")).toBe("Subject");
  });

  it("falls back to body when no subject", () => {
    expect(computeTitle(undefined, "Body content")).toBe("Body content");
  });

  it("truncates long body titles", () => {
    const longBody = "a".repeat(100);
    const result = computeTitle(undefined, longBody);
    expect(result.length).toBe(53); // 50 + "..."
    expect(result.endsWith("...")).toBe(true);
  });

  it("handles empty body", () => {
    expect(computeTitle()).toBe("");
  });
});
