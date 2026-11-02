import Link from "next/link";
import { formatClock } from "@/lib/planSeat";
import { createClient } from "@/lib/supabase/server";
import { DeleteTripButton } from "./DeleteTripButton";

const dateFormat = new Intl.DateTimeFormat("es-MX", {
  timeZone: "America/Mexico_City",
  weekday: "short",
  day: "numeric",
  month: "short",
});

export default async function MisViajes() {
  const supabase = await createClient();
  // RLS returns only the signed-in rider's rows.
  const { data, error } = await supabase
    .from("trips")
    .select("id, depart_slot, wait_min, ride_min, seated, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`mis-viajes: ${error.message}`);

  const seatedCount = data.filter((trip) => trip.seated).length;

  return (
    <main className="mx-auto w-full max-w-md px-5 py-6">
      <h1 className="text-4xl font-black tracking-tight">Mis viajes</h1>

      {data.length === 0 ? (
        <p className="mt-4 text-xl leading-snug">Todavía no has registrado ningún viaje.</p>
      ) : (
        <>
          <p className="mt-3 text-2xl font-bold">
            Sentado: {seatedCount} de {data.length === 1 ? "tu 1 viaje" : `tus ${data.length} viajes`}
          </p>
          <ul className="mt-4 space-y-3">
            {data.map((trip) => (
              <li
                key={trip.id}
                className="flex items-center justify-between gap-3 rounded-2xl border-2 border-[#d9d5ce] bg-[#ecebe6] px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm text-neutral-600">
                    {dateFormat.format(new Date(trip.created_at))}
                  </p>
                  <p className="text-lg font-bold">
                    {formatClock(trip.depart_slot.slice(0, 5))} en la parada ·{" "}
                    {trip.seated ? "Sentado" : "Parado"}
                  </p>
                  <p className="text-base">
                    Fila {trip.wait_min} min · arriba {trip.ride_min} min
                  </p>
                </div>
                <DeleteTripButton id={trip.id} />
              </li>
            ))}
          </ul>
        </>
      )}

      <Link
        href="/registrar"
        className="mt-6 block rounded-2xl border-2 border-[#141414] px-4 py-3 text-center text-xl font-bold"
      >
        Registrar mi viaje en la 120
      </Link>
      <Link href="/" className="mt-4 inline-block py-2 text-lg font-semibold underline">
        Volver al inicio
      </Link>
    </main>
  );
}
