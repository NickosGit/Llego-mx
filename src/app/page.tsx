import Link from "next/link";
import { PlanInputs } from "@/components/PlanInputs";
import { SimulatedBanner } from "@/components/SimulatedBanner";
import { corridor } from "@/config/corridor";
import { getForecastCell, type ForecastCell } from "@/lib/forecast";
import { dayTypeOf, parsePlanInputs } from "@/lib/planInputs";
import { earlierSlots, formatClock, planSeat, searchWindow, type Plan } from "@/lib/planSeat";
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
      <p className="mt-1 flex items-baseline gap-3 text-2xl font-semibold">
        sal a las
        <span className="text-6xl font-black tracking-tight">{formatClock(suggestion.slot)}</span>
      </p>
      <p className="mt-1 text-base font-semibold">Hora de estar en la parada</p>
      <p className="mt-2 text-lg">
        <SeatChance outOf10={suggestion.seatOutOf10} />
      </p>
      <p className="mt-1 text-base">
        Fila típica {suggestion.p50_wait} min · llegas ~{suggestion.arrival}
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
        Fila típica {usual.p50_wait} min · llegas ~{usual.arrival}
      </p>
      <p className="mt-0.5 text-base font-semibold">Día malo: llegas ~{usual.badDayArrival}</p>
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
  const maxEarlierMin = searchWindow(Number(inputs.antes), corridor);

  const slots = [inputs.sales, ...earlierSlots(inputs.sales, maxEarlierMin)];
  const cells = new Map<string, ForecastCell>(
    await Promise.all(
      slots.map(async (slot) => [slot, await getForecastCell(dayType, slot)] as const),
    ),
  );

  const user = await getCurrentUser();

  const plan = planSeat({
    arriveBy: inputs.llegar,
    usualDepart: inputs.sales,
    maxEarlierMin,
    dayType,
    config: corridor,
    forecast: (_day, slot) => cells.get(slot)!,
  });

  return (
    <div className="flex min-h-dvh flex-col">
      {plan.hasSimulated && <SimulatedBanner />}
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pt-6 pb-5">
        <h1 className="text-5xl font-black tracking-tight">¿Llego?</h1>
        <p className="mt-2 text-xl font-semibold leading-snug">
          ¿A qué hora llegas a la parada para irte sentado en la 120 y seguir llegando a tiempo?
        </p>
        <p className="mt-1 text-base text-neutral-600">
          {corridor.route} · Las Alamedas → El Rosario
        </p>

        <PlanInputs {...inputs} />
        <p className="mt-2 text-sm font-semibold text-neutral-700">
          Las horas de salida son de cuando ya estás en la parada de la 120, no de tu casa.
        </p>

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
        {plan.state === "sin_sugerencia" && maxEarlierMin === 0 && (
          <MessageCard>
            Sin llegar antes a la parada, no hay forma de irte sentado más seguido. No te vamos a
            pedir que duermas menos: si algún día sí puedes, dinos cuánto arriba.
          </MessageCard>
        )}
        {plan.state === "sin_sugerencia" && maxEarlierMin > 0 && (
          <MessageCard>
            Llegando hasta {maxEarlierMin} min antes, no hay una hora en la que la mayoría de las
            veces se vaya sentado y llegues a tiempo en un día malo.
          </MessageCard>
        )}
        {plan.suggestion && <SuggestionCard suggestion={plan.suggestion} />}
        {plan.usual && <UsualCard usual={plan.usual} />}

        {plan.badDayWarning && (
          <p className="mt-4 rounded-xl border-2 border-[#b45309] bg-[#fef3c7] px-4 py-3 text-base font-semibold text-[#5c2d04]">
            Ojo: a tu hora, en un día malo, llegarías después de las {inputs.llegar}.
          </p>
        )}

        {plan.suggestion && (
          <p className="mt-4 text-center text-lg leading-snug">
            Cambias <strong>{plan.suggestion.minutesEarlier} min de sueño</strong>
            <br />
            por <strong>~{plan.suggestion.seatedMin} min sentado</strong> en la 120
          </p>
        )}

        <p className="mt-2 text-center text-sm text-neutral-600">
          Metro + caminar: {corridor.restOfTripMin} min <em>(estimado de Rodolfo)</em>
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
      </main>
    </div>
  );
}
