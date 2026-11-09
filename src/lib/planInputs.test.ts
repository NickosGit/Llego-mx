import { describe, expect, it } from "vitest";
import { dayTypeOf, parsePlanInputs, tomorrowDia } from "./planInputs";

// Sunday 1 Nov 2026, 22:00 in Mexico City.
const sundayNight = new Date("2026-11-02T04:00:00Z");

describe("parsePlanInputs", () => {
  it("uses the defaults and tomorrow when there are no params", () => {
    expect(parsePlanInputs({}, sundayNight)).toEqual({ llegar: "07:00", sales: "04:45", dia: "lunes", limite: 0 });
  });

  it("reads valid params", () => {
    expect(parsePlanInputs({ llegar: "06:00", sales: "04:15", dia: "sabado" }, sundayNight)).toEqual({
      llegar: "06:00",
      sales: "04:15",
      dia: "sabado",
      limite: 0,
    });
  });

  it("falls back on invalid params", () => {
    expect(parsePlanInputs({ llegar: "99:00", sales: ["04:15", "04:30"], dia: "feriado" }, sundayNight)).toEqual({
      llegar: "07:00",
      sales: "04:45",
      dia: "lunes",
      limite: 0,
    });
  });

  it("reads the rider's limit and falls back to No puedo (0)", () => {
    const limite = (value?: string | string[]) =>
      parsePlanInputs(value === undefined ? {} : { limite: value }, sundayNight).limite;
    expect(limite()).toBe(0);
    expect(limite("999")).toBe(0);
    expect(limite("abc")).toBe(0);
    expect(limite(["15", "30"])).toBe(0);
    expect(limite("30")).toBe(30);
    expect(limite("60")).toBe(60);
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
