import Link from "next/link";

// Placeholder until the ride form arrives in commit 4.
export default function Registrar() {
  return (
    <main className="mx-auto w-full max-w-md px-5 py-8">
      <h1 className="text-4xl font-black tracking-tight">Registrar mi viaje</h1>
      <p className="mt-4 text-xl leading-snug">Muy pronto vas a poder registrar tu viaje aquí.</p>
      <Link href="/" className="mt-6 inline-block text-lg font-semibold underline">
        Volver
      </Link>
    </main>
  );
}
