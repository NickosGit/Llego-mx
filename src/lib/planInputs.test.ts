import { describe, expect, it } from "vitest";
import { dayTypeOf, defaultDia, parsePlanInputs, tomorrowDia } from "./planInputs";

// Sunday 1 Nov 2026, 22:00 in Mexico City.
const sundayNight = new Date("2026-11-02T04:00:00Z");

describe("parsePlanInputs", () => {
  it("uses the defaults and tomorrow when there are no params", () => {
    expect(parsePlanInputs({}, sundayNight)).toEqual({
      llegar: "07:00",
      sales: "04:45",
      dia: "lunes",
      antes: "0",
    });
  });

  it("reads valid params", () => {
    expect(
      parsePlanInputs({ llegar: "06:00", sales: "04:15", dia: "sabado", antes: "15" }, sundayNight),
    ).toEqual({
      llegar: "06:00",
      sales: "04:15",
      dia: "sabado",
      antes: "15",
    });
  });

  it("falls back on invalid params", () => {
    expect(
      parsePlanInputs(
        { llegar: "99:00", sales: ["04:15", "04:30"], dia: "feriado", antes: "120" },
        sundayNight,
      ),
    ).toEqual({
      llegar: "07:00",
      sales: "04:45",
      dia: "lunes",
      antes: "0",
    });
  });
});

describe("days", () => {
  it("uses Mexico City's date, not UTC's", () => {
    // Already Monday 04:00 UTC, still Sunday in Mexico City, so tomorrow is Monday.
    expect(tomorrowDia(sundayNight)).toBe("lunes");
  });

  it("defaults to a weekday so the first screen is never empty", () => {
    // Friday 6 Nov 2026, 11:00 in Mexico City: tomorrow is sábado, so lunes.
    expect(defaultDia(new Date("2026-11-06T17:00:00Z"))).toBe("lunes");
    // Tuesday 3 Nov 2026, 04:30 in Mexico City, standing in line: today.
    expect(defaultDia(new Date("2026-11-03T10:30:00Z"))).toBe("martes");
    // Tuesday 3 Nov 2026, 21:00 in Mexico City: tomorrow.
    expect(defaultDia(new Date("2026-11-04T03:00:00Z"))).toBe("miercoles");
  });

  it("maps weekdays to laborable", () => {
    expect(dayTypeOf("martes")).toBe("laborable");
    expect(dayTypeOf("sabado")).toBe("sabado");
    expect(dayTypeOf("domingo")).toBe("domingo");
  });
});
