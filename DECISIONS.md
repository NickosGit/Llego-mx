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
- **Own Supabase project:** `llego-mx`, ref `ftfjqdjsthsakqqmjivk`, in its own organization. `schema.sql` and `seed.sql` are applied. `forecast_slot` returns the prompt's table for all four slots, sábado and domingo return n = 0, and the anon client gets 0 rows from `trips`.
- **Anon key is Supabase's publishable key** (`sb_publishable_...`), stored under the env var name the prompt requires.
- **Do not run `schema.sql` or `seed.sql` on the shared Supabase project.** It already has a Week 7 `trips` table with a different schema: `create table if not exists` would skip it, and the seed's `delete ... where is_simulated` would erase Week 7's simulated rows.
- **The secrets grep runs with `-- ":!docs"`.** Run literally, it always matches `docs/PACKET.md` and `docs/IMPLEMENTATION_PROMPT.md`, which quote the pattern itself. Those two lines are the only matches.

### Seat plan (commit 3)
- **`ya_sentado` copy follows the prompt:** "A tu hora ya sueles ir sentado: X de cada 10." PACKET §12 words it differently; the meaning is the same.
- **`sin_sugerencia` shows only the honest message,** per the prompt. PACKET §5a's "show best one found" is not built, so no slot that fails the goal looks recommended.
- **`hasSimulated` covers every cell the plan read,** including slots it searched and rejected, because they shaped the answer.
- **A bad query param falls back to its default** instead of breaking the screen.
- **`/registrar` is a placeholder** until commit 4, so the home button doesn't lead to a 404.
- **Deploy #2 first failed with HTTP 500.** The build ran before the env vars existed, and `NEXT_PUBLIC_*` values are inlined at build time. Vercel's log: "Your project's URL and Key are required". Saving the vars isn't enough: a new build has to follow.

### Auth and ride logging (commit 4)
- **Sign-in screen says why before asking:** the persona closes anything that asks for an account without saying what for. The forecast stays public.
- **`next` only accepts `/registrar` or `/mis-viajes`,** so a crafted link can't send anyone off-site after sign-in.
- **Blank minutes are rejected, not read as 0.** `z.coerce.number()` alone turns "" into 0, which would log a false "no line" ride.
- **The form uses `noValidate`** so errors come from zod, inline and in Spanish, instead of the browser's tooltip.
- **Borrar takes two taps** (not in the prompt): a delete can't be undone and this gets used one-handed on a bus.
- **The success screen shows the banner** when its count includes simulated rows (hard rule 6).

## Week 13 — real users (Layer 2)

### Pain #1: the app asked Rodolfo for something he can't do (6 Nov 2026)
- **Evidence, from Rodolfo via Nico (WhatsApp, before his session):** he sleeps at 22:00 and wakes at 4:15. Leaving earlier "would mean sleeping 3–4 hours" (his feeling; the real cost of 15 min earlier is 6 h 15 → 6 h). He can't let a full 120 go and take the next one because he'd be late for work.
- **So his Week 12 "yes, I'd leave 15 min earlier" did not survive two follow-up questions.** Both seat levers are closed for him: earlier costs sleep, skipping a bus costs punctuality. This is the threat to the 10:1, so it is pain #1, not a UI confusion.
- **Fix: the rider sets the limit, the app never assumes it.** New input "¿Puedes llegar antes a la parada?" (`antes`: 0/15/30/45/60, **default 0**). The search only goes as far back as the rider allows, still capped at 1 h. With 0 the app says plainly it won't ask them to sleep less, and still shows what it knows.
- **The usual card now shows the bad-day arrival** (p90, rounded up, never shown better than it is). For Rodolfo at 4:45 on the seed that is ~7:00: zero slack, which is his real situation.
- **Default day is a weekday.** Before 10:00 it's today, after that tomorrow, and a weekend lands on lunes. Friday's "tomorrow = sábado = Sin dato" emptied the first screen, which ends a user session.
- **The question is now visible at the top.** Before, "sentado" was only in the meta description; a stranger opening the link didn't know what the app promised.
- **Before/after:** production before the merge shows "sal a las 4:30" for 04:45 lunes; the branch preview shows the 0-minute default with no suggestion. Screenshot both.

### Testing logistics
- **Google sign-in is still in Testing.** Strangers can see the forecast (public) but can't log rides unless their Gmail is added as a test user. Add each tester before their session, or use a message as the "would come back" proof.
- **Two rides dated 6 Nov in Nico's account** (4:45 and 5:00, both seated). If they were tests, delete them: they're counted in the public forecast and are not flagged simulated.

## Not now
- Metro legs (seat or time).
- Return trip.
- Live reports.

## Open
- [ ] Ratify the pivot with Team 4.
- [ ] Rodolfo: week A logs (at 4:45), then week B (at the suggested time).
- [ ] Ask Rodolfo how long he takes from home to the stop. His baseline's 4:45 is leaving home, but slots mean reaching the stop, so his true default slot may be later (see `docs/PERSONA_LOG.md`).
- [ ] Persona test confusions still open: why the data is simulated (#1), the 06:00 message (#4), and the trade line reading as certain (#5).
- [ ] Add Rodolfo as a test user on the Google consent screen. The `llego-mx` client lives in the Google Cloud project "Sello", in Testing, where Google blocks anyone not on the list. Publishing would need a homepage and a privacy policy page, so it stays in Testing. Check which app name he sees at sign-in; changing it there also affects Sello.
- [ ] Local Google sign-in lands on production instead of `localhost:4000`: Supabase isn't accepting the localhost redirect yet. Production works, so testing runs there for now.
- [x] Default day: fixed in Week 13 (weekday default, today before 10:00).
- [ ] Week 13: 5 sessions (Rodolfo + 4, at least 3 strangers), pain ranking, one user who comes back.

## Tomorrow's first move
Screenshot production (before), check the branch preview (after), merge, then run Rodolfo's session on the new version. Add each tester's Gmail to the Google test users first.
