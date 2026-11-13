import { describe, expect, it } from "vitest";
import { addDays, dayKey, streaks, toggle, weekdayRates, rate, type Habit } from "./habits";

const h = (done: string[], days = [0, 1, 2, 3, 4, 5, 6]): Habit => ({
  id: "a", name: "Ler", emoji: "📖", days, done, created: "2026-01-01",
});

describe("dayKey/addDays", () => {
  it("uses local yyyy-mm-dd and crosses months", () => {
    expect(dayKey(new Date(2026, 0, 31))).toBe("2026-01-31");
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("streaks", () => {
  it("counts consecutive days ending today", () => {
    expect(streaks(h(["2026-05-08", "2026-05-09", "2026-05-10"]), "2026-05-10")).toEqual({ current: 3, best: 3 });
  });
  it("keeps current streak alive if today is not done yet", () => {
    expect(streaks(h(["2026-05-08", "2026-05-09"]), "2026-05-10").current).toBe(2);
  });
  it("breaks after a missed scheduled day and tracks best", () => {
    const r = streaks(h(["2026-05-01", "2026-05-02", "2026-05-03", "2026-05-06", "2026-05-07"]), "2026-05-07");
    expect(r).toEqual({ current: 2, best: 3 });
  });
  it("skips days the habit is not scheduled", () => {
    // weekdays only; 2026-05-09/10 are Sat/Sun
    const r = streaks(h(["2026-05-07", "2026-05-08", "2026-05-11"], [1, 2, 3, 4, 5]), "2026-05-11");
    expect(r.current).toBe(3);
  });
});

describe("toggle", () => {
  it("adds and removes a day immutably", () => {
    const a = h([]);
    const b = toggle(a, "2026-05-10");
    expect(b.done).toEqual(["2026-05-10"]);
    expect(a.done).toEqual([]);
    expect(toggle(b, "2026-05-10").done).toEqual([]);
  });
});

describe("rates", () => {
  it("computes completion over scheduled days in a window", () => {
    expect(rate(h(["2026-05-09", "2026-05-10"]), "2026-05-10", 4)).toBe(0.5);
  });
  it("computes per-weekday rates", () => {
    const r = weekdayRates([h(["2026-05-10"])], "2026-05-10", 2); // Sundays: 05-10 done, 05-03 not
    expect(r[0]).toBe(0.5);
  });
});
