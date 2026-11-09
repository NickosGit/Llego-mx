import { describe, expect, it } from "vitest";
import { corridor } from "../config/corridor";
import type { DayType, ForecastCell } from "./forecast";
import { earlierSlots, formatLimit, planSeat, searchWindow } from "./planSeat";

const noData: ForecastCell = {
  n: 0,
  seat_rate: null,
  p50_wait: null,
  p50_ride: null,
  p90_total: null,
  has_simulated: false,
};

function cell(n: number, seat_rate: number, p50_wait: number, p50_ride: number, p90_total: number): ForecastCell {
  return { n, seat_rate, p50_wait, p50_ride, p90_total, has_simulated: true };
}

const seed: Record<string, ForecastCell> = {
  "04:15": cell(13, 0.8, 7, 34, 50),
  "04:30": cell(12, 0.7, 10, 33, 53),
  "04:45": cell(14, 0.3, 16, 34, 57),
  "05:00": cell(13, 0.2, 19, 34, 62),
};

function forecast(dayType: DayType, slot: string): ForecastCell {
  return dayType === "laborable" ? (seed[slot] ?? noData) : noData;
}

// Week 12 tests searched the full hour; they keep doing so with limit 60.
function plan(
  overrides: { arriveBy?: string; usualDepart?: string; dayType?: DayType; limitMin?: number } = {},
) {
  return planSeat({
    arriveBy: "07:00",
    usualDepart: "04:45",
    dayType: "laborable",
    limitMin: 60,
    config: corridor,
    forecast,
    ...overrides,
  });
}

describe("planSeat", () => {
  it("suggests 04:30 for a 04:45 rider", () => {
    const result = plan();
    expect(result.state).toBe("sugerencia");
    expect(result.suggestion).toEqual({
      slot: "04:30",
      seatOutOf10: 7,
      p50_wait: 10,
      arrival: "6:30",
      minutesEarlier: 15,
      seatedMin: 33,
      n: 12,
    });
    expect(result.usual).toMatchObject({ seatOutOf10: 3, arrival: "6:50", onTime: true, n: 14 });
    expect(result.label).toEqual({ text: "Poco dato", n: 12 });
    expect(result.badDayWarning).toBe(false);
    expect(result.hasSimulated).toBe(true);
  });

  it("changes nothing when the 04:15 rider already sits", () => {
    const result = plan({ usualDepart: "04:15" });
    expect(result.state).toBe("ya_sentado");
    expect(result.usual?.seatOutOf10).toBe(8);
    expect(result.suggestion).toBeNull();
  });

  it("gives no suggestion and warns when arriving by 06:00", () => {
    const result = plan({ arriveBy: "06:00" });
    expect(result.state).toBe("sin_sugerencia");
    expect(result.suggestion).toBeNull();
    expect(result.badDayWarning).toBe(true);
  });

  it("returns sin_dato on domingo with nothing slot-level", () => {
    const result = plan({ dayType: "domingo" });
    expect(result.state).toBe("sin_dato");
    expect(result.usual).toBeNull();
    expect(result.suggestion).toBeNull();
    expect(result.label.text).toBe("Sin dato");
    expect(result.hasSimulated).toBe(false);
  });

  it("never suggests more than one hour earlier", () => {
    expect(earlierSlots("04:45", corridor.searchWindowMin)).toEqual(["04:30", "04:15", "04:00", "03:45"]);
  });

  it("labels 30 or more rides as Buen dato", () => {
    const result = planSeat({
      arriveBy: "07:00",
      usualDepart: "04:15",
      dayType: "laborable",
      limitMin: 60,
      config: corridor,
      forecast: () => cell(30, 0.8, 7, 34, 50),
    });
    expect(result.label).toEqual({ text: "Buen dato", n: 30 });
  });

  it("does not suggest a slot that misses the arrival on a bad day", () => {
    const result = planSeat({
      arriveBy: "07:00",
      usualDepart: "04:45",
      dayType: "laborable",
      limitMin: 60,
      config: corridor,
      forecast: (_day, slot) => (slot === "04:30" ? cell(12, 0.7, 10, 33, 90) : forecast("laborable", slot)),
    });
    expect(result.suggestion?.slot).toBe("04:15");
  });
});

describe("planSeat with the rider's limit", () => {
  it("usual 04:45, limit 0: sin_margen, no suggestion", () => {
    const result = plan({ limitMin: 0 });
    expect(result.state).toBe("sin_margen");
    expect(result.suggestion).toBeNull();
    expect(result.usual?.seatOutOf10).toBe(3);
  });

  it("usual 04:45, limit 15: suggests 04:30, 7 de cada 10", () => {
    const result = plan({ limitMin: 15 });
    expect(result.state).toBe("sugerencia");
    expect(result.suggestion).toMatchObject({ slot: "04:30", seatOutOf10: 7, minutesEarlier: 15 });
  });

  it("usual 05:00, limit 15: 04:45 only has 3 de cada 10, so sin_sugerencia", () => {
    const result = plan({ usualDepart: "05:00", limitMin: 15 });
    expect(result.state).toBe("sin_sugerencia");
    expect(result.suggestion).toBeNull();
  });

  it("usual 05:00, limit 30: suggests 04:30", () => {
    const result = plan({ usualDepart: "05:00", limitMin: 30 });
    expect(result.state).toBe("sugerencia");
    expect(result.suggestion).toMatchObject({ slot: "04:30", minutesEarlier: 30 });
  });

  it("usual 04:15, limit 0: ya_sentado", () => {
    const result = plan({ usualDepart: "04:15", limitMin: 0 });
    expect(result.state).toBe("ya_sentado");
    expect(result.suggestion).toBeNull();
  });

  it("arrive 06:00, usual 04:45, limit 60: sin_sugerencia with the bad-day warning", () => {
    const result = plan({ arriveBy: "06:00", limitMin: 60 });
    expect(result.state).toBe("sin_sugerencia");
    expect(result.badDayWarning).toBe(true);
  });

  it.each([0, 15, 30, 45, 60])("domingo, limit %i: sin_dato", (limitMin) => {
    const result = plan({ dayType: "domingo", limitMin });
    expect(result.state).toBe("sin_dato");
    expect(result.suggestion).toBeNull();
  });

  it.each([0, 15, 30, 45, 60])("never suggests past a limit of %i min", (limitMin) => {
    // Only the slot a full hour earlier seats most riders.
    const result = planSeat({
      arriveBy: "07:00",
      usualDepart: "05:00",
      dayType: "laborable",
      limitMin,
      config: corridor,
      forecast: (_day, slot) => cell(20, slot === "04:00" ? 0.9 : 0.2, 5, 30, 40),
    });
    if (limitMin === 60) {
      expect(result.suggestion).toMatchObject({ slot: "04:00", minutesEarlier: 60 });
    } else {
      expect(result.suggestion).toBeNull();
    }
  });
});

describe("limit helpers", () => {
  it("caps the search at the corridor's hour", () => {
    expect(searchWindow(0, corridor)).toBe(0);
    expect(searchWindow(30, corridor)).toBe(30);
    expect(searchWindow(90, corridor)).toBe(60);
  });

  it("says 1 h for 60", () => {
    expect(formatLimit(15)).toBe("15 min");
    expect(formatLimit(60)).toBe("1 h");
  });
});
