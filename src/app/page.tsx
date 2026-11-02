import { SimulatedBanner } from "@/components/SimulatedBanner";
import { corridor } from "@/config/corridor";

export default function Home() {
  return (
    <>
      <SimulatedBanner />
      <main className="mx-auto w-full max-w-md px-5 py-8">
        <h1 className="text-5xl font-black tracking-tight">¿Llego?</h1>
        <p className="mt-2 text-base text-neutral-600">
          {corridor.route} · Las Alamedas → El Rosario
        </p>
        <p className="mt-8 text-2xl font-semibold leading-snug">
          ¿A qué hora salgo para ir sentado en la 120, y seguir llegando a las 7?
        </p>
        <p className="mt-6 text-base text-neutral-600">
          Metro + caminar: {corridor.restOfTripMin} min{" "}
          <em>(estimado de Rodolfo)</em>
        </p>
      </main>
    </>
  );
}
