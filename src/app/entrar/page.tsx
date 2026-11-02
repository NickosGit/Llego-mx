import Link from "next/link";
import { redirect } from "next/navigation";
import { signInWithGoogle } from "@/lib/authActions";
import { safeNext } from "@/lib/authPaths";
import { getCurrentUser } from "@/lib/supabase/server";

export default async function Entrar({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const next = safeNext(params.next);

  if (await getCurrentUser()) redirect(next);

  return (
    <main className="mx-auto w-full max-w-md px-5 py-8">
      <h1 className="text-4xl font-black tracking-tight">Entra para registrar tu viaje</h1>
      <p className="mt-4 text-xl leading-snug">
        Tu cuenta de Google solo sirve para guardar tus viajes a tu nombre. Solo tú los ves, y
        puedes borrarlos cuando quieras.
      </p>
      <p className="mt-3 text-base text-neutral-600">
        Para ver a qué hora salir no necesitas cuenta.
      </p>

      {params.error && (
        <p role="alert" className="mt-4 text-base font-semibold text-[#b42318]">
          No pudimos entrar con Google. Inténtalo otra vez.
        </p>
      )}

      <form action={signInWithGoogle} className="mt-6">
        <input type="hidden" name="next" value={next} />
        <button
          type="submit"
          className="w-full rounded-2xl bg-[#141414] px-4 py-4 text-xl font-bold text-white"
        >
          Entrar con Google
        </button>
      </form>

      <Link href="/" className="mt-6 inline-block py-2 text-lg font-semibold underline">
        Volver
      </Link>
    </main>
  );
}
