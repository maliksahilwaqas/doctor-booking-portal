import { describe, expect, it } from "vitest";
import { doseLabel, followUpLabel } from "@/lib/calc/prescription";

describe("doseLabel", () => {
  it("combines morning and night", () => {
    expect(doseLabel({ name: "Panadol", morning: true, night: true })).toBe("Morning and night");
  });

  it("morning only", () => {
    expect(doseLabel({ name: "Panadol", morning: true, night: false })).toBe("Morning");
  });

  it("night only", () => {
    expect(doseLabel({ name: "Panadol", morning: false, night: true })).toBe("Night");
  });

  it("falls back when neither is checked", () => {
    expect(doseLabel({ name: "Panadol", morning: false, night: false })).toBe("As directed");
  });
});

describe("followUpLabel", () => {
  it("formats a day count", () => {
    expect(followUpLabel(30)).toBe("Follow up in 30 days");
  });

  it("is null when there's no follow-up", () => {
    expect(followUpLabel(null)).toBeNull();
  });
});
