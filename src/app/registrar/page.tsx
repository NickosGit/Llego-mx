import Link from "next/link";
import { corridor } from "@/config/corridor";
import { todayDia } from "@/lib/planInputs";
import { TripForm } from "./TripForm";

export default function Registrar() {
  return (
    <main className="mx-auto w-full max-w-md px-5 py-6">
      <h1 className="text-4xl font-black tracking-tight">Registrar mi viaje</h1>
      <p className="mt-2 text-base text-neutral-600">
        Solo tú ves tus viajes. Al pronóstico solo llegan sumados con los demás.
      </p>
      <TripForm today={todayDia(new Date())} usualDepart={corridor.defaults.usualDepart} />
      <Link href="/" className="mt-4 inline-block py-2 text-lg font-semibold underline">
        Volver
      </Link>
    </main>
  );
}
