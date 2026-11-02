import { describe, expect, it } from "vitest";
import { dayTypeOf, parsePlanInputs, tomorrowDia } from "./planInputs";

// Sunday 1 Nov 2026, 22:00 in Mexico City.
const sundayNight = new Date("2026-11-02T04:00:00Z");

describe("parsePlanInputs", () => {
  it("uses the defaults and tomorrow when there are no params", () => {
    expect(parsePlanInputs({}, sundayNight)).toEqual({ llegar: "07:00", sales: "04:45", dia: "lunes" });
  });

  it("reads valid params", () => {
    expect(parsePlanInputs({ llegar: "06:00", sales: "04:15", dia: "sabado" }, sundayNight)).toEqual({
      llegar: "06:00",
      sales: "04:15",
      dia: "sabado",
    });
  });

  it("falls back on invalid params", () => {
    expect(parsePlanInputs({ llegar: "99:00", sales: ["04:15", "04:30"], dia: "feriado" }, sundayNight)).toEqual({
      llegar: "07:00",
      sales: "04:45",
      dia: "lunes",
    });
  });
});

describe("days", () => {
  it("uses Mexico City's date, not UTC's", () => {
    // Already Monday 04:00 UTC, still Sunday in Mexico City, so tomorrow is Monday.
    expect(tomorrowDia(sundayNight)).toBe("lunes");
  });

  it("maps weekdays to laborable", () => {
    expect(dayTypeOf("martes")).toBe("laborable");
    expect(dayTypeOf("sabado")).toBe("sabado");
    expect(dayTypeOf("domingo")).toBe("domingo");
  });
});
