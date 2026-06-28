import { describe, it, expect } from "vitest";
import { computeTitle } from "../../../apps/notifyx-delivery-service/src/channels.js";

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
    expect(result.length).toBe(53);
    expect(result.endsWith("...")).toBe(true);
  });

  it("handles empty body", () => {
    expect(computeTitle()).toBe("");
  });
});
