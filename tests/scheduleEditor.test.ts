import { describe, expect, it } from "vitest";
import { computeSessionPreview } from "@/lib/calc/scheduleEditor";

describe("computeSessionPreview", () => {
  it("divides by fixed slot length", () => {
    const p = computeSessionPreview(540, 720, "slot", 5, 24);
    expect(p.tokenCount).toBe(36);
    expect(p.slotMinutesDisplay).toBe(5);
    expect(p.lastTokenTime).toBe("11:55");
    expect(p.effectiveSlotMin).toBe(5);
  });

  it("divides by fixed patient count", () => {
    const p = computeSessionPreview(540, 720, "count", 5, 24);
    expect(p.tokenCount).toBe(24);
    expect(p.slotMinutesDisplay).toBe(7.5);
    expect(p.lastTokenTime).toBe("11:41");
    expect(p.effectiveSlotMin).toBe(7);
  });
});
