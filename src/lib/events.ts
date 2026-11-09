import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { after } from "next/server";
import {
  NOCOUNT_COOKIE,
  TESTER_COOKIE,
  VISITOR_COOKIE,
  eventArgs,
  type EventFields,
  type EventName,
} from "@/lib/eventCookies";

// Anonymous on purpose: no session cookies, so the call never carries the rider's account.
function anonClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } },
  );
}

// Server-only. Never throws: an analytics error must not break the page.
// The insert runs after the response is sent, so it adds no wait for the rider.
export async function logEvent(name: EventName, fields: EventFields = {}): Promise<void> {
  try {
    const requestHeaders = await headers();
    if (requestHeaders.get("next-router-prefetch")) return; // a prefetch is not a visit

    const jar = await cookies();
    const args = eventArgs(name, fields, {
      nocount: jar.get(NOCOUNT_COOKIE)?.value,
      visitorId: jar.get(VISITOR_COOKIE)?.value,
      tester: jar.get(TESTER_COOKIE)?.value,
    });
    if (!args) return;

    after(async () => {
      try {
        const { error } = await anonClient().rpc("log_event", args);
        if (error) console.error(`log_event (${name}): ${error.message}`);
      } catch (e) {
        console.error(`log_event (${name}):`, e);
      }
    });
  } catch (e) {
    console.error(`logEvent (${name}):`, e);
  }
}
