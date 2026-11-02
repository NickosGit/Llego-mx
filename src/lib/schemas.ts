import { z } from "zod";
import { DEPART_OPTIONS, DIAS, type Dia } from "@/lib/planInputs";

// An empty field must fail: z.coerce.number() alone would read "" as 0 minutes.
function minutes(min: number, max: number) {
  const message = `Escribe un número entero de ${min} a ${max}.`;
  return z
    .string({ error: message })
    .trim()
    .min(1, message)
    .pipe(z.coerce.number<string>({ error: message }).int(message).min(min, message).max(max, message));
}

export const tripSchema = z.object({
  dia: z.enum(DIAS.map((d) => d.value) as [Dia, ...Dia[]], { error: "Elige un día." }),
  slot: z
    .string({ error: "Elige una hora." })
    .refine((v) => DEPART_OPTIONS.includes(v), "Elige una hora de la lista."),
  wait_min: minutes(0, 180),
  ride_min: minutes(5, 300),
  seated: z.enum(["si", "no"], { error: "Dinos si fuiste sentado." }),
});

export const tripIdSchema = z.uuid();
