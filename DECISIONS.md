# DECISIONS — ¿Llego?

## Week 12 — rebuild as venture

### The pivot (1 Nov 2026)
- **Killed: "what time do I leave?" for time alone.** Rodolfo's baseline: leaves 4:45, arrives 6:45–6:50 for 7:00. His padding is 10–15 min, and his "3 hours" is ~45 min getting ready + ~2 h of real travel. A leave-by app gives back almost nothing.
- **New question: "what time do I leave to ride the 120 seated and still arrive by 7?"** His own quote is about the line and standing, and asked "¿saldrías 15 min antes si supieras que vas sentado?", he said yes.
- **Same venture, same chapter (W7), same route, same data loop, same Shadow Clause.** Only the question and one column (`seated`) changed.

### Scope
- **Real route:** Ruta 120 from Walmart Las Alamedas to Metro El Rosario, then Metro L6 → L5 → L1 to Candelaria, then a walk to San Lázaro.
- **Only the 120 is measured.** The Metro + walk is Rodolfo's estimate (75 min), labeled "estimado de Rodolfo".
- **No worker data, ever:** no unit, plate, driver, operator or location columns.
- **Forecast is public, logging needs Google.** Rides sit behind owner-only RLS; users can delete them (no edit). Rider defaults (07:00 / 04:45) live in config and query params, never the DB.
- **k = 10:** nothing slot-level is shown with fewer than 10 rides (Blueprint risk: sparse data).
- **A suggestion must be on time on a bad day (p90)** and at most 1 h earlier than usual. Seat goal is 6 of 10.
- **Seed is simulated** (`is_simulated = true`, banner), anchored to his baseline at 4:45 (~6:50 arrival). The "3 → 7 de cada 10" on the demo screen is invented and labeled, not evidence.

## Blueprint T4 conditions
- C2 ✅ baseline + consent + stated preference (1 Nov 2026).
- C3/C4 test: week A at 4:45 (baseline seat rate), week B at the suggested time. The trade holds if B gives ≥ 3 more seated days out of 5 and he never arrives after 7:00. Written before the data.
- ⚠️ The Blueprint declared the bet as typical/bad travel times. **Tell the team about the move to seat-on-the-120 and ratify it.**

### Where this build lives (1 Nov 2026)
- **New folder and repo, `llego-mx`.** `llego.vercel.app` belongs to an unrelated site, so the PACKET's fallback `llego-mx.vercel.app` applies. The Week 7 app stays untouched: its repo `NickosGit/Llego`, its Vercel project `llego` and `llego-sigma.vercel.app`.
- **Next.js 15, per the prompt.** The Week 7 app is on Next 16, so route protection here uses `middleware.ts`, not `proxy.ts`.
- **Deploy #1 live:** https://llego-mx.vercel.app, from `NickosGit/Llego-mx`, Vercel project `llego-mx`. No env vars yet: nothing reads Supabase. Checked at 360px on production.
- **Do not run `schema.sql` or `seed.sql` on the shared Supabase project.** It already has a Week 7 `trips` table with a different schema: `create table if not exists` would skip it, and the seed's `delete ... where is_simulated` would erase Week 7's simulated rows.
- **The secrets grep runs with `-- ":!docs"`.** Run literally, it always matches `docs/PACKET.md` and `docs/IMPLEMENTATION_PROMPT.md`, which quote the pattern itself. Those two lines are the only matches.

## Not now
- Metro legs (seat or time).
- Return trip.
- Live reports.

## Open
- [ ] Ratify the pivot with Team 4.
- [ ] Rodolfo: week A logs (at 4:45), then week B (at the suggested time).
- [ ] Choose a Supabase project for this build (see "Where this build lives").

## Tomorrow's first move
Create a separate Supabase project for this build, then run commit 2.
