import Link from "next/link";
import { signOut } from "@/lib/authActions";
import { getCurrentUser } from "@/lib/supabase/server";

export async function AccountBar() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <header className="flex items-center justify-end gap-4 bg-[#141414] px-5 text-base font-semibold text-white">
      <Link href="/mis-viajes" className="py-2.5">
        Mis viajes
      </Link>
      <form action={signOut}>
        <button type="submit" className="py-2.5 underline">
          Salir
        </button>
      </form>
    </header>
  );
}
