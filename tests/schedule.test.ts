import { describe, expect, it } from "vitest";
import { buildDayList, dayInfo, dayLabel, findOpenDayIndex, followUpDateISO, isDayOpen, todayISO } from "@/lib/calc/schedule";

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

// The clinic is in Pakistan (UTC+5, no daylight saving), so its day starts at
// 19:00 UTC the evening before. Using the UTC date made every screen think it
// was still yesterday from midnight until 05:00 local time.
describe("todayISO", () => {
  it("is still the same day one minute before local midnight", () => {
    expect(todayISO(new Date("2026-09-18T18:59:00Z"))).toBe("2026-09-18");
  });

  it("rolls over exactly at local midnight, not at UTC midnight", () => {
    expect(todayISO(new Date("2026-09-18T19:00:00Z"))).toBe("2026-09-19");
    expect(todayISO(new Date("2026-09-18T19:10:00Z"))).toBe("2026-09-19");
  });

  it("stays on the local date through the early hours", () => {
    expect(todayISO(new Date("2026-09-19T00:30:00Z"))).toBe("2026-09-19");
  });
});

describe("followUpDateISO", () => {
  it("counts from the clinic's date, not the UTC date, of the prescription", () => {
    // 01:00 on 19 Sep in Pakistan is still 18 Sep in UTC.
    expect(followUpDateISO("2026-09-18T20:00:00Z", 15)).toBe("2026-10-04");
  });

  it("crosses month ends", () => {
    expect(followUpDateISO("2026-09-20T06:00:00Z", 15)).toBe("2026-10-05");
  });
});
