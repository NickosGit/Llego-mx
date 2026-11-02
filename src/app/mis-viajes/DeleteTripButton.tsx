"use client";

import { useState } from "react";
import { deleteTrip } from "./actions";

// Two taps: one hand on a moving bus makes a wrong tap easy, and a delete can't be undone.
export function DeleteTripButton({ id }: { id: string }) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-xl border-2 border-[#141414] px-4 py-2 text-base font-bold"
      >
        Borrar
      </button>
    );
  }

  return (
    <form action={deleteTrip} className="flex flex-wrap items-center justify-end gap-2">
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="rounded-xl bg-[#b42318] px-4 py-2 text-base font-bold text-white">
        Sí, borrar
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="rounded-xl border-2 border-[#141414] px-4 py-2 text-base font-bold"
      >
        No
      </button>
    </form>
  );
}
