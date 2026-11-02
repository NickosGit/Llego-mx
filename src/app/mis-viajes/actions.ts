"use server";

import { revalidatePath } from "next/cache";
import { tripIdSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";

export async function deleteTrip(formData: FormData) {
  const id = tripIdSchema.safeParse(formData.get("id"));
  if (!id.success) return;

  // RLS only lets an owner delete a row, so someone else's id removes nothing.
  const supabase = await createClient();
  const { error } = await supabase.from("trips").delete().eq("id", id.data);
  if (error) throw new Error(`deleteTrip: ${error.message}`);

  revalidatePath("/mis-viajes");
}
