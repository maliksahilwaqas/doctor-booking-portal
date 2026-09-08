import { describe, expect, it } from "vitest";
import { buildDayList, dayInfo, dayLabel, findOpenDayIndex, isDayOpen } from "@/lib/calc/schedule";

describe("dayInfo", () => {
  it("computes weekday as 1=Mon..7=Sun", () => {
    // 2026-09-07 is a Monday.
    expect(dayInfo("2026-09-07").weekday).toBe(1);
    // 2026-09-06 is a Sunday.
    expect(dayInfo("2026-09-06").weekday).toBe(7);
  });

  it("formats a day label", () => {
    expect(dayLabel(dayInfo("2026-09-05"))).toBe("Sat 5 Sep");
  });
});

describe("isDayOpen", () => {
  it("respects location days and doctor off-days", () => {
    expect(isDayOpen([1, 2, 3, 4, 5, 6], [7], 1)).toBe(true);
    expect(isDayOpen([1, 2, 3, 4, 5, 6], [7], 7)).toBe(false); // not in location.days
    expect(isDayOpen([1, 2, 3, 4, 5, 6, 7], [7], 7)).toBe(false); // doctor off-day overrides
  });
});

describe("findOpenDayIndex", () => {
  it("skips forward over closed days", () => {
    const dayList = buildDayList("2026-09-05", 10); // Sat 5 Sep .. Mon 14 Sep
    // Aga Clinic: Tue/Thu only, no doctor off-days.
    const idx = findOpenDayIndex(dayList, [2, 4], [], 0, 1);
    expect(dayList[idx].weekday).toBe(2); // next Tuesday
  });

  it("falls back to the opposite direction when nothing is open ahead", () => {
    // 5-day list from Sat 5 Sep: Sat, Sun, Mon, Tue, Wed. Only Tuesday is
    // open; stepping forward from the last day (Wed) finds nothing ahead,
    // so it must fall back to searching backward and land on Tuesday.
    const dayList = buildDayList("2026-09-05", 5);
    const idx = findOpenDayIndex(dayList, [2], [], 4, 1);
    expect(dayList[idx].weekday).toBe(2);
  });
});
