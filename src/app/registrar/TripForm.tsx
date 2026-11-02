"use client";

import Link from "next/link";
import { useActionState } from "react";
import { SimulatedBanner } from "@/components/SimulatedBanner";
import { DEPART_OPTIONS, DIAS, type Dia } from "@/lib/planInputs";
import { logTrip, type TripFormState } from "./actions";

const fieldClass =
  "mt-1 w-full rounded-xl border-2 border-[#141414] bg-white px-3 py-3 text-xl font-semibold";

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return (
    <p role="alert" className="mt-1 text-base font-semibold text-[#b42318]">
      {messages[0]}
    </p>
  );
}

function SeatedOption({ value, label, checked }: { value: string; label: string; checked: boolean }) {
  return (
    <label className="block cursor-pointer">
      <input type="radio" name="seated" value={value} defaultChecked={checked} className="peer sr-only" />
      <span className="block rounded-xl border-2 border-[#141414] py-3 text-center text-xl font-bold peer-checked:bg-[#141414] peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2">
        {label}
      </span>
    </label>
  );
}

export function TripForm({ today, usualDepart }: { today: Dia; usualDepart: string }) {
  const initial: TripFormState = {
    version: 0,
    values: { dia: today, slot: usualDepart },
    fieldErrors: {},
    formError: null,
    success: null,
  };
  const [state, action, isPending] = useActionState(logTrip, initial);

  if (state.success) {
    return (
      <>
        {state.success.hasSimulated && (
          <div className="mt-4">
            <SimulatedBanner />
          </div>
        )}
        <p role="status" className="mt-6 text-3xl font-black leading-tight">
          Tu viaje cuenta. Esta franja ahora tiene {state.success.n}{" "}
          {state.success.n === 1 ? "viaje" : "viajes"}.
        </p>
        <Link
          href="/mis-viajes"
          className="mt-6 block rounded-2xl border-2 border-[#141414] px-4 py-3 text-center text-xl font-bold"
        >
          Ver mis viajes
        </Link>
      </>
    );
  }

  const { values, fieldErrors } = state;

  return (
    <form key={state.version} action={action} noValidate className="mt-5 space-y-4">
      <label className="block">
        <span className="text-lg font-semibold">Día</span>
        <select name="dia" defaultValue={values.dia} className={fieldClass}>
          {DIAS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
        <FieldError messages={fieldErrors.dia} />
      </label>

      <label className="block">
        <span className="text-lg font-semibold">¿A qué hora llegaste a la parada de la 120?</span>
        <select name="slot" defaultValue={values.slot} className={fieldClass}>
          {DEPART_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <FieldError messages={fieldErrors.slot} />
      </label>

      <label className="block">
        <span className="text-lg font-semibold">Minutos en la fila</span>
        <input
          name="wait_min"
          type="number"
          inputMode="numeric"
          defaultValue={values.wait_min}
          className={fieldClass}
        />
        <FieldError messages={fieldErrors.wait_min} />
      </label>

      <label className="block">
        <span className="text-lg font-semibold">Minutos arriba hasta El Rosario</span>
        <input
          name="ride_min"
          type="number"
          inputMode="numeric"
          defaultValue={values.ride_min}
          className={fieldClass}
        />
        <FieldError messages={fieldErrors.ride_min} />
      </label>

      <fieldset>
        <legend className="text-lg font-semibold">¿Fuiste sentado?</legend>
        <div className="mt-1 grid grid-cols-2 gap-2">
          <SeatedOption value="si" label="Sí" checked={values.seated === "si"} />
          <SeatedOption value="no" label="No" checked={values.seated === "no"} />
        </div>
        <FieldError messages={fieldErrors.seated} />
      </fieldset>

      {state.formError && (
        <p role="alert" className="text-base font-semibold text-[#b42318]">
          {state.formError}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-2xl bg-[#141414] px-4 py-4 text-xl font-bold text-white disabled:opacity-60"
      >
        {isPending ? "Guardando…" : "Guardar mi viaje"}
      </button>
    </form>
  );
}
