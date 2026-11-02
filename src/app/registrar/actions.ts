"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getForecastCell } from "@/lib/forecast";
import { dayTypeOf } from "@/lib/planInputs";
import { tripSchema } from "@/lib/schemas";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

export type TripFormState = {
  version: number;
  values: Record<string, string>;
  fieldErrors: Record<string, string[] | undefined>;
  formError: string | null;
  success: { n: number; hasSimulated: boolean } | null;
};

export async function logTrip(prev: TripFormState, formData: FormData): Promise<TripFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar?next=/registrar");

  const raw = {
    dia: formData.get("dia") ?? undefined,
    slot: formData.get("slot") ?? undefined,
    wait_min: formData.get("wait_min") ?? undefined,
    ride_min: formData.get("ride_min") ?? undefined,
    seated: formData.get("seated") ?? undefined,
  };
  const base = {
    version: prev.version + 1,
    values: Object.fromEntries(
      Object.entries(raw).map(([key, value]) => [key, typeof value === "string" ? value : ""]),
    ),
  };

  const parsed = tripSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ...base,
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      formError: null,
      success: null,
    };
  }

  const dayType = dayTypeOf(parsed.data.dia);
  const supabase = await createClient();
  const { error } = await supabase.from("trips").insert({
    user_id: user.id,
    day_type: dayType,
    depart_slot: parsed.data.slot,
    wait_min: parsed.data.wait_min,
    ride_min: parsed.data.ride_min,
    seated: parsed.data.seated === "si",
    is_simulated: false,
  });
  if (error) {
    return {
      ...base,
      fieldErrors: {},
      formError: "No pudimos guardar tu viaje. Inténtalo otra vez.",
      success: null,
    };
  }

  const cell = await getForecastCell(dayType, parsed.data.slot);
  return {
    ...base,
    fieldErrors: {},
    formError: null,
    success: { n: cell.n, hasSimulated: cell.has_simulated },
  };
}
