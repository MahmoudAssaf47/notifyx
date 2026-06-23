import { describe, it, expect } from "vitest";

// Inline test of the spam check logic from notification service
function checkSpam(body: string): { isSpam: boolean; category?: string; reason?: string } {
  const SPAM_KEYWORDS = [
    "viagra", "cialis", "casino", "gambling", "crypto", "bitcoin",
    "buy now", "discount", "free offer", "make money", "investment",
  ];
  const lowercaseBody = body.toLowerCase();
  for (const keyword of SPAM_KEYWORDS) {
    if (lowercaseBody.includes(keyword)) {
      return { isSpam: true, category: "content_filter", reason: `Contains forbidden keyword: ${keyword}` };
    }
  }
  if (/<script/i.test(body) || /javascript:/i.test(body)) {
    return { isSpam: true, category: "security", reason: "Script injection detected" };
  }
  return { isSpam: false };
}

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
