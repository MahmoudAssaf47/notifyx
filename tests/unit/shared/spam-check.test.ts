import { describe, it, expect } from "vitest";
import { checkSpam } from "../../../apps/notifyx-notification-service/src/validator.js";

describe("Spam Detection", () => {
  it("detects spam keywords", () => {
    const result = checkSpam("Buy Bitcoin now and make money fast");
    expect(result.isSpam).toBe(true);
    expect(result.category).toBe("content_filter");
  });

  it("detects script injection", () => {
    const result = checkSpam("<script>alert('xss')</script>");
    expect(result.isSpam).toBe(true);
    expect(result.category).toBe("security");
  });

  it("allows clean messages", () => {
    const result = checkSpam("Hello, this is a normal message");
    expect(result.isSpam).toBe(false);
  });

  it("is case insensitive for keywords", () => {
    const result = checkSpam("Free Offer inside");
    expect(result.isSpam).toBe(true);
  });
});
