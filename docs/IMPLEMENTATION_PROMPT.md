# Implementation prompt — ¿Llego? (Week 13: rider limit, disclosure, event log, real-user fix)

Paste everything below into your coding agent and run it from the repo root (`Llego-mx`). First put the new `docs/PACKET.md`, `docs/USER_SESSIONS.md` and `docs/PAIN_RANKING.md` in the repo.

---

You are continuing **¿Llego?**, a live Next.js 15 app (https://llego-mx.vercel.app) that tells riders of the Ruta 120 (Las Alamedas → Metro El Rosario) how often the bus was ridden seated at a given time at the stop. Week 12's build works and is tested (`docs/TEST_LOG.md`). **Read `docs/PACKET.md` first: it is this week's spec.** Read `DECISIONS.md` for everything already decided. Don't redesign what exists.

This week you will:
1. Let the rider set how much earlier they could be at the stop, and **never suggest anything past that**.
2. Fix the copy that misleads a stranger (simulated data, estimates, arrival).
3. Add a first-party, anonymous **event log**.
4. After my five user sessions, fix the #1 pain from `docs/PAIN_RANKING.md`.

## Hard rules

1. **Stack unchanged:** Next.js 15 App Router + TypeScript + Tailwind + Supabase (`@supabase/ssr`) + zod, Vercel project `llego-mx`, Supabase project `llego-mx`. **No new npm dependencies.** No third-party analytics.
2. **No secrets in the repo.** Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Never a service-role key.
3. **Never add a column, field, prop or log for vehicle unit, plate, driver, operator or GPS location.**
4. **The event log never stores** `user_id`, email, name, phone, IP, user agent or location, and never joins to `auth.users`.
5. **The rider's limit is law.** With limit 0 ("No puedo antes"), no earlier time may appear anywhere on the screen: not in a card, not in the trade line, not in a hint. With limit N, nothing earlier than N minutes before the usual slot.
6. All UI copy in Spanish (Mexico), large type, high contrast, 360px wide with no horizontal scroll. Seat chances read **"X de cada 10 veces fue sentado"**, never a promise.
7. Ask me before anything irreversible: running SQL on Supabase, deleting data, changing RLS, renaming projects, force-pushing.
8. **Do not run anything on the shared Supabase project** (see DECISIONS). Only on `llego-mx` (ref `ftfjqdjsthsakqqmjivk`), and only after I say OK.
9. Every session ends with: `DECISIONS.md` updated (a "Week 13" section: decisions + tomorrow's first move), commit, push.

## 1. Rider limit

- **Query param `limite`**, values `0 | 15 | 30 | 45 | 60` (minutes earlier at the stop). Parse it in `parsePlanInputs` with the same `.catch(default)` pattern. **Default `0`.**
- **UI:** below the three fields, the question **"¿Cuánto antes podrías estar en la parada sin que te cueste?"** and five pill buttons in one row: **No puedo · 15 min · 30 min · 45 min · 1 h**. The selected one is dark. Each pill is at least 44px tall. Changing it updates the URL through the existing `router.replace` flow in `PlanInputs`.
- **`planSeat`** takes `limitMin`. The search window is `min(limitMin, config.searchWindowMin)`.
- **New state `sin_margen`:** when `limitMin === 0` and the usual slot has data but isn't `ya_sentado`. Message card: **"Respetamos tu hora. No te vamos a pedir salir antes."** Show the usual card. No suggestion, no trade line.
- **`sin_sugerencia` copy** names the limit: **"Dentro de tu margen (hasta N min antes) no hubo una hora en la que la mayoría de las veces se fuera sentado."** For 60, say "1 h". This replaces "hasta 1 h antes…", which confused the persona (PERSONA_LOG #4).
- **Trade line (replaces "Cambias N min de sueño por…")**, only in `sugerencia`: **"Si estás en la parada N min antes: X de cada 10 veces fue sentado, contra Y de cada 10 a tu hora."** No sleep framing (PERSONA_LOG #5; Blueprint condition 4).
- `sin_dato` and `ya_sentado` behave as before, regardless of the limit.

**Unit tests** (add to `planSeat.test.ts`, same seed; keep the existing ones passing after updating them to pass `limitMin`):
- usual 04:45, limit 0 → `sin_margen`, `suggestion === null`
- usual 04:45, limit 15 → `sugerencia` at 04:30, 7 de cada 10, minutesEarlier 15
- usual 05:00, limit 15 → no 04:30 suggestion possible: 04:45 has 0.3 → `sin_sugerencia`
- usual 05:00, limit 30 → `sugerencia` at 04:30
- usual 04:15, limit 0 → `ya_sentado`
- arrive 06:00, usual 04:45, limit 60 → `sin_sugerencia` + bad-day warning
- domingo, any limit → `sin_dato`
- `parsePlanInputs`: `limite=999`, `limite=abc` and missing → 0; `limite=30` → 30

## 2. Disclosure for strangers

- **Banner:** keep "DATOS SIMULADOS" and add a second, smaller, non-uppercase line: **"Ejemplo inventado para probar la app. Aún no son viajes reales."** (PERSONA_LOG #1)
- **Arrival:** "llegas ~6:50" → **"llegas al trabajo ~6:50"** in every card (PERSONA_LOG #11).
- **Metro estimate:** "(estimado de Rodolfo)" → **"(estimado, no medido)"**. Strangers don't know who Rodolfo is (PERSONA_LOG #8). Keep the code comment in `corridor.ts` saying where the 75 comes from.
- **Field label:** "Sueles salir" → **"En la parada"**. Keep the line under the fields saying the times mean being at the stop, not leaving home.

## 3. Event log

**SQL** — write `supabase/events.sql` and **show it to me before running it**:

```sql
create table if not exists public.events (
  id          bigint generated always as identity primary key,
  visitor_id  uuid not null,
  tester      text check (tester ~ '^u[1-9]$'),
  name        text not null check (name in ('view','ride_logged')),
  day_type    text check (day_type in ('laborable','sabado','domingo')),
  slot        time,
  limit_min   int  check (limit_min in (0,15,30,45,60)),
  state       text check (state in ('sin_dato','ya_sentado','sin_margen','sugerencia','sin_sugerencia')),
  created_at  timestamptz not null default now()
);
alter table public.events enable row level security;
-- No policies on purpose: nobody reads, updates or deletes through the API.

create or replace function public.log_event(
  p_visitor_id uuid, p_tester text, p_name text,
  p_day_type text, p_slot time, p_limit_min int, p_state text
) returns void
language sql security definer set search_path = public as $$
  insert into public.events (visitor_id, tester, name, day_type, slot, limit_min, state)
  values (p_visitor_id, p_tester, p_name, p_day_type, p_slot, p_limit_min, p_state);
$$;
revoke all on function public.log_event from public;
grant execute on function public.log_event to anon, authenticated;
```

The table's `check` constraints do the validation; a bad argument makes the insert fail.

Also write `supabase/queries/returning.sql`, for me to run in the SQL editor:
- per `tester` (non-null): first seen, last seen, **distinct days (America/Mexico_City)**, views, limits chosen
- per `visitor_id`: the same, filtered to visitors seen on **2+ distinct days**
- the count of `ride_logged` per day

**Cookies, in `middleware.ts`** (after the Supabase block, on the final `response`, and also on `request.cookies` so the page sees them on the very first request):
- `llego_vid`: if missing, `crypto.randomUUID()`; httpOnly, sameSite lax, secure in production, 180 days.
- `llego_t`: if `?t=` matches `^u[1-9]$`, set it (httpOnly, 90 days). Ignore anything else.
- Don't touch either cookie when `llego_nocount=1`.

**Logging:** a server-only helper `src/lib/events.ts` → `logEvent(name, fields)`. It reads the cookies, returns without doing anything if `llego_nocount=1` or there's no `llego_vid`, calls the RPC, and **never throws**: an analytics error must not break the page (`console.error` and move on).
- `view`: in `src/app/page.tsx` after `planSeat`, with `day_type`, `slot = inputs.sales`, `limit_min`, `state`.
- `ride_logged`: in `logTrip` after a successful insert, with `day_type` and `slot` only.

**Disclosure + opt-out:** at the bottom of home, small grey text: **"Contamos visitas sin nombre ni ubicación para saber si la app sirve."** + link **"No contar las mías"** → route `/no-contar` (GET route handler) sets `llego_nocount=1` (1 year) and redirects to `/` with a one-time note **"Listo, ya no contamos tus visitas."** When opted out, show **"No contamos tus visitas."** instead.

## 4. After the sessions: fix #1 (wait for me)

I'll fill `docs/USER_SESSIONS.md` and `docs/PAIN_RANKING.md`. When I say go:
- Before changing anything, take a 360px screenshot of the screen where #1 happens, save it as `docs/evidence/fix1-before.png`.
- Fix only #1, the smallest change that removes the consequence. Add a test if it touches logic.
- Deploy, take `docs/evidence/fix1-after.png` on production, and write the fix in the "Fix #1" section of `PAIN_RANKING.md` (what changed, commit hash, before/after paths).
- If the #1 pain is "the answer doesn't change what I do," **stop and tell me** instead of coding: that's a product decision, not a bug.

## Commit plan (minimum 5 commits, 2 deploys)

| # | Commit | Acceptance criteria |
|---|---|---|
| 1 | `feat: rider sets own limit, never suggest past it` | All unit tests in §1 pass; default screen shows `sin_margen` and no earlier time; pills work at 360px |
| 2 | `fix: disclose simulated and estimated data for strangers` | Banner second line, "al trabajo," "estimado, no medido," "En la parada"; mechanical checks 1–6 pass |
| 3 | `feat(analytics): anonymous event log, tester tags, opt-out` | `events.sql` applied after my OK; checks 7–10 pass; page still renders if the RPC fails (test by pointing at a wrong function name locally). **Deploy #1** |
| 4 | `test: week 13 mechanical pass + fix` | All 11 checks in PACKET §12a in `docs/TEST_LOG.md` (Week 13 section), at least one bug found and fixed |
| 5 | `fix: user test #1 — <pain>` | §4 done with before/after evidence. **Deploy #2** |

## Security checks before every deploy

- `git grep -nE "service_role|sb_secret|eyJhbGci" -- ":!docs"` returns nothing.
- RLS enabled on `trips` **and** `events`.
- Anon client: `select * from events` → 0 rows; direct `insert into events` → rejected; `select * from trips` → 0 rows.
- `events` has no column that identifies a person (rule 4).

Start with commit 1. After each commit, tell me what you did and what to test, then wait for my OK before the next one.
