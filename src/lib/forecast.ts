import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type DayType = "laborable" | "sabado" | "domingo";

// Everything except n and has_simulated is null when n < 10.
const forecastCellSchema = z.object({
  n: z.number().int(),
  seat_rate: z.coerce.number().nullable(),
  p50_wait: z.number().int().nullable(),
  p50_ride: z.number().int().nullable(),
  p90_total: z.number().int().nullable(),
  has_simulated: z.boolean(),
});

export type ForecastCell = z.infer<typeof forecastCellSchema>;

export async function getForecastCell(
  dayType: DayType,
  slot: string,
): Promise<ForecastCell> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("forecast_slot", {
    p_day_type: dayType,
    p_slot: slot,
  });
  if (error) throw new Error(`forecast_slot: ${error.message}`);
  return forecastCellSchema.parse(data?.[0]);
}
