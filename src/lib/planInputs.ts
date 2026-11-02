import { z } from "zod";
import { corridor } from "@/config/corridor";
import type { DayType } from "@/lib/forecast";

export const DIAS = [
  { value: "lunes", label: "lunes", dayType: "laborable" },
  { value: "martes", label: "martes", dayType: "laborable" },
  { value: "miercoles", label: "miércoles", dayType: "laborable" },
  { value: "jueves", label: "jueves", dayType: "laborable" },
  { value: "viernes", label: "viernes", dayType: "laborable" },
  { value: "sabado", label: "sábado", dayType: "sabado" },
  { value: "domingo", label: "domingo", dayType: "domingo" },
] as const satisfies readonly { value: string; label: string; dayType: DayType }[];

export type Dia = (typeof DIAS)[number]["value"];

function quarterHours(from: string, to: string): string[] {
  const [fromH, fromM] = from.split(":").map(Number);
  const [toH, toM] = to.split(":").map(Number);
  const slots: string[] = [];
  for (let m = fromH * 60 + fromM; m <= toH * 60 + toM; m += 15) {
    slots.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  }
  return slots;
}

export const ARRIVE_OPTIONS = quarterHours("05:00", "12:00");
export const DEPART_OPTIONS = quarterHours("03:00", "11:45");

// The weekday in Mexico City, which has had no daylight saving since 2022.
export function todayDia(now: Date): Dia {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Mexico_City",
    weekday: "short",
  }).format(now);
  const byWeekday: Record<string, Dia> = {
    Mon: "lunes",
    Tue: "martes",
    Wed: "miercoles",
    Thu: "jueves",
    Fri: "viernes",
    Sat: "sabado",
    Sun: "domingo",
  };
  return byWeekday[weekday];
}

export function tomorrowDia(now: Date): Dia {
  return todayDia(new Date(now.getTime() + 24 * 60 * 60 * 1000));
}

export function dayTypeOf(dia: Dia): DayType {
  return DIAS.find((d) => d.value === dia)!.dayType;
}

// A bad or missing query param falls back to its default instead of breaking the screen.
export function parsePlanInputs(
  params: Record<string, string | string[] | undefined>,
  now: Date,
) {
  const oneOf = (options: string[], fallback: string) =>
    z.string().refine((v) => options.includes(v)).catch(fallback);

  return z
    .object({
      llegar: oneOf(ARRIVE_OPTIONS, corridor.defaults.arriveBy),
      sales: oneOf(DEPART_OPTIONS, corridor.defaults.usualDepart),
      dia: z.enum(DIAS.map((d) => d.value) as [Dia, ...Dia[]]).catch(tomorrowDia(now)),
    })
    .parse(params);
}
