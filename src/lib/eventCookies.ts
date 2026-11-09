// Pure helpers for the anonymous event log, shared by middleware and the server.
// No next/* imports, so they run in the Edge middleware and in unit tests.
import type { DayType } from "@/lib/forecast";
import type { PlanState } from "@/lib/planSeat";

export const VISITOR_COOKIE = "llego_vid";
export const TESTER_COOKIE = "llego_t";
export const NOCOUNT_COOKIE = "llego_nocount";
export const FLASH_COOKIE = "llego_flash"; // one-time note after /no-contar

const DAY = 24 * 60 * 60;
const TESTER_RE = /^u[1-9]$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type CookieToSet = {
  name: string;
  value: string;
  options: { httpOnly: true; sameSite: "lax"; secure: boolean; path: "/"; maxAge: number };
};

function cookie(name: string, value: string, maxAge: number, secure: boolean): CookieToSet {
  return { name, value, options: { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge } };
}

export function isOptedOut(nocount: string | undefined): boolean {
  return nocount === "1";
}

// Cookies the middleware should set for this request. Never touches anything once opted out.
export function visitorCookies(input: {
  nocount: string | undefined;
  visitorId: string | undefined;
  testerParam: string | null;
  secure: boolean;
  newId: () => string;
}): CookieToSet[] {
  if (isOptedOut(input.nocount)) return [];
  const out: CookieToSet[] = [];
  if (!input.visitorId || !UUID_RE.test(input.visitorId)) {
    out.push(cookie(VISITOR_COOKIE, input.newId(), 180 * DAY, input.secure));
  }
  if (input.testerParam && TESTER_RE.test(input.testerParam)) {
    out.push(cookie(TESTER_COOKIE, input.testerParam, 90 * DAY, input.secure));
  }
  return out;
}

export function optOutCookie(secure: boolean): CookieToSet {
  return cookie(NOCOUNT_COOKIE, "1", 365 * DAY, secure);
}

export function flashCookie(secure: boolean): CookieToSet {
  return cookie(FLASH_COOKIE, "nocount", 60, secure);
}

export type EventName = "view" | "ride_logged";
export type EventFields = {
  day_type?: DayType;
  slot?: string;
  limit_min?: number;
  state?: PlanState;
};

// The log_event RPC arguments, or null when nothing may be logged.
export function eventArgs(
  name: EventName,
  fields: EventFields,
  jar: { nocount?: string; visitorId?: string; tester?: string },
) {
  if (isOptedOut(jar.nocount)) return null;
  if (!jar.visitorId || !UUID_RE.test(jar.visitorId)) return null;
  return {
    p_visitor_id: jar.visitorId,
    p_tester: jar.tester && TESTER_RE.test(jar.tester) ? jar.tester : null,
    p_name: name,
    p_day_type: fields.day_type ?? null,
    p_slot: fields.slot ?? null,
    p_limit_min: fields.limit_min ?? null,
    p_state: fields.state ?? null,
  };
}
