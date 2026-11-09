import { cookies } from "next/headers";
import Link from "next/link";
import { PlanInputs } from "@/components/PlanInputs";
import { SimulatedBanner } from "@/components/SimulatedBanner";
import { corridor } from "@/config/corridor";
import { FLASH_COOKIE, NOCOUNT_COOKIE, isOptedOut } from "@/lib/eventCookies";
import { logEvent } from "@/lib/events";
import { getForecastCell, type ForecastCell } from "@/lib/forecast";
import { dayTypeOf, parsePlanInputs } from "@/lib/planInputs";
import { earlierSlots, formatClock, formatLimit, planSeat, searchWindow, type Plan } from "@/lib/planSeat";
import { getCurrentUser } from "@/lib/supabase/server";

function SeatChance({ outOf10 }: { outOf10: number }) {
  return (
    <>
      <strong className="font-bold">{outOf10} de cada 10</strong> veces fue sentado
    </>
  );
}

function SuggestionCard({ suggestion }: { suggestion: NonNullable<Plan["suggestion"]> }) {
  return (
    <section className="mt-4 rounded-2xl bg-[#1f7a4a] px-5 py-4 text-white">
      <h2 className="text-sm font-bold tracking-wider uppercase">Para ir sentado</h2>
      {/* The slot is the time at the stop, not leaving home: never "sal a las" (TEST_LOG W13). */}
      <p className="mt-1 text-2xl font-semibold">en la parada a las</p>
      <p className="text-6xl font-black tracking-tight">{formatClock(suggestion.slot)}</p>
      <p className="mt-2 text-lg">
        <SeatChance outOf10={suggestion.seatOutOf10} />
      </p>
      <p className="mt-1 text-base">
        Fila típica {suggestion.p50_wait} min ·{" "}
        <span className="whitespace-nowrap">llegas al trabajo ~{suggestion.arrival}</span>
      </p>
    </section>
  );
}

function UsualCard({ usual }: { usual: NonNullable<Plan["usual"]> }) {
  return (
    <section className="mt-4 rounded-2xl border-2 border-[#d9d5ce] bg-[#ecebe6] px-5 py-3.5">
      <h2 className="text-sm font-bold tracking-wider uppercase">
        A tu hora ({formatClock(usual.slot)})
      </h2>
      <p className="mt-1 text-lg">
        <SeatChance outOf10={usual.seatOutOf10} />
      </p>
      <p className="mt-0.5 text-base">
        Fila típica {usual.p50_wait} min ·{" "}
        <span className="whitespace-nowrap">llegas al trabajo ~{usual.arrival}</span>
      </p>
    </section>
  );
}

function MessageCard({ children }: { children: React.ReactNode }) {
  return (
    <section className="mt-4 rounded-2xl border-2 border-[#141414] px-5 py-4 text-xl font-semibold leading-snug">
      {children}
    </section>
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const inputs = parsePlanInputs(await searchParams, new Date());
  const dayType = dayTypeOf(inputs.dia);

  // Only read slots inside the rider's limit: with "No puedo", just their own.
  const slots = [inputs.sales, ...earlierSlots(inputs.sales, searchWindow(inputs.limite, corridor))];
  const cells = new Map<string, ForecastCell>(
    await Promise.all(
      slots.map(async (slot) => [slot, await getForecastCell(dayType, slot)] as const),
    ),
  );

  const user = await getCurrentUser();

  const plan = planSeat({
    arriveBy: inputs.llegar,
    usualDepart: inputs.sales,
    dayType,
    limitMin: inputs.limite,
    config: corridor,
    forecast: (_day, slot) => cells.get(slot)!,
  });

  await logEvent("view", {
    day_type: dayType,
    slot: inputs.sales,
    limit_min: inputs.limite,
    state: plan.state,
  });
  const jar = await cookies();
  const optedOut = isOptedOut(jar.get(NOCOUNT_COOKIE)?.value);
  const justOptedOut = optedOut && jar.has(FLASH_COOKIE);

  return (
    <div className="flex min-h-dvh flex-col">
      {plan.hasSimulated && <SimulatedBanner />}
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pt-6 pb-5">
        <h1 className="text-5xl font-black tracking-tight">¿Llego?</h1>
        <p className="mt-1 text-base text-neutral-600">
          {corridor.route} · Las Alamedas → El Rosario
        </p>

        <PlanInputs {...inputs}>
          <p className="mt-2 text-sm font-semibold text-neutral-700">
            Las horas son de cuando ya estás en la parada de la 120, no de cuando sales de tu casa.
          </p>
        </PlanInputs>

        {plan.state === "sin_dato" && (
          <MessageCard>
            Todavía no hay suficientes viajes a tu hora. Registra el tuyo y ayuda a que haya dato.
          </MessageCard>
        )}
        {plan.state === "ya_sentado" && plan.usual && (
          <MessageCard>
            A tu hora ya sueles ir sentado: {plan.usual.seatOutOf10} de cada 10.
          </MessageCard>
        )}
        {plan.state === "sin_margen" && (
          <MessageCard>Respetamos tu hora. No te vamos a pedir salir antes.</MessageCard>
        )}
        {plan.state === "sin_sugerencia" && (
          <MessageCard>
            Dentro de tu margen (hasta {formatLimit(inputs.limite)} antes) no hubo una hora en la
            que la mayoría de las veces se fuera sentado.
          </MessageCard>
        )}
        {plan.suggestion && <SuggestionCard suggestion={plan.suggestion} />}
        {plan.usual && <UsualCard usual={plan.usual} />}

        {plan.badDayWarning && (
          <p className="mt-4 rounded-xl border-2 border-[#b45309] bg-[#fef3c7] px-4 py-3 text-base font-semibold text-[#5c2d04]">
            Ojo: a tu hora, en un día malo, llegarías después de las {inputs.llegar}.
          </p>
        )}

        {plan.state === "sugerencia" && plan.suggestion && plan.usual && (
          <p className="mt-4 text-center text-lg leading-snug">
            Si estás en la parada {plan.suggestion.minutesEarlier} min antes:{" "}
            <strong>{plan.suggestion.seatOutOf10} de cada 10</strong> veces fue sentado, contra{" "}
            <strong>{plan.usual.seatOutOf10} de cada 10</strong> a tu hora.
          </p>
        )}

        <p className="mt-2 text-center text-sm text-neutral-600">
          Metro + caminar: {corridor.restOfTripMin} min <em>(estimado, no medido)</em>
        </p>

        <p className="mt-3 mb-4 text-center">
          <span className="inline-block rounded-full bg-[#e4e3de] px-4 py-1.5 text-sm font-semibold text-neutral-700">
            {plan.label.text === "Sin dato"
              ? "Sin dato"
              : `${plan.label.text} · ${plan.label.n} viajes`}
          </span>
        </p>

        <Link
          href="/registrar"
          className="mt-auto block rounded-2xl border-2 border-[#141414] px-4 py-3 text-center"
        >
          <span className="block text-xl font-bold">Registrar mi viaje en la 120</span>
          {!user && (
            <span className="block text-sm text-neutral-600">Necesitas entrar con Google</span>
          )}
        </Link>

        <p className="mt-4 text-center text-xs leading-snug text-neutral-600" role="status">
          {justOptedOut ? (
            "Listo, ya no contamos tus visitas."
          ) : optedOut ? (
            "No contamos tus visitas."
          ) : (
            <>
              Contamos visitas sin nombre ni ubicación para saber si la app sirve ·{" "}
              {/* A plain <a>: <Link> would prefetch the route and opt the rider out by itself. */}
              <a href="/no-contar" className="inline-block py-2 font-semibold underline">
                No contar las mías
              </a>
            </>
          )}
        </p>
      </main>
    </div>
  );
}
