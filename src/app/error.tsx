"use client";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto w-full max-w-md px-5 py-8">
      <h1 className="text-5xl font-black tracking-tight">¿Llego?</h1>
      <p className="mt-6 text-xl font-semibold leading-snug">
        No pudimos cargar el pronóstico. Revisa tu señal e inténtalo otra vez.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 w-full rounded-2xl border-2 border-[#141414] px-4 py-3 text-xl font-bold"
      >
        Reintentar
      </button>
    </main>
  );
}
