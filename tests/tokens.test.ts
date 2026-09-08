import { describe, expect, it } from "vitest";
import { tokenCount, tokenStartMinutes, tokenTime } from "@/lib/calc/tokens";

describe("tokenCount", () => {
  it("floors an uneven range", () => {
    // Shifa Hospital: 09:00-12:00 (180 min), 5 min slots -> 36 tokens
    expect(tokenCount({ fromMin: 540, toMin: 720, slotMin: 5 })).toBe(36);
  });

  it("handles a range that doesn't divide evenly", () => {
    expect(tokenCount({ fromMin: 540, toMin: 720, slotMin: 7 })).toBe(25);
  });
});

describe("tokenTime", () => {
  const loc = { fromMin: 540, toMin: 720, slotMin: 5 };

  it("token 1 starts at fromMin", () => {
    expect(tokenStartMinutes(loc, 1)).toBe(540);
    expect(tokenTime(loc, 1)).toBe("09:00");
  });

  it("later tokens step by slotMin", () => {
    expect(tokenTime(loc, 4)).toBe("09:15");
  });
});
