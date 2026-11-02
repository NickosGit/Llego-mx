import { describe, expect, it } from "vitest";
import { corridor } from "../config/corridor";
import type { DayType, ForecastCell } from "./forecast";
import { earlierSlots, planSeat } from "./planSeat";

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

function plan(overrides: { arriveBy?: string; usualDepart?: string; dayType?: DayType } = {}) {
  return planSeat({
    arriveBy: "07:00",
    usualDepart: "04:45",
    dayType: "laborable",
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
      config: corridor,
      forecast: (_day, slot) => (slot === "04:30" ? cell(12, 0.7, 10, 33, 90) : forecast("laborable", slot)),
    });
    expect(result.suggestion?.slot).toBe("04:15");
  });
});
