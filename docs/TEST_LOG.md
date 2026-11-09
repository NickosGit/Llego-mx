# Test log — ¿Llego?

## Week 13 — mechanical pass (PACKET §12a)

Run on 8 Nov 2026 (≈ 22:55–23:05 Mexico City) against production (https://llego-mx.vercel.app), Deploy #1 at `d8975ea`, at 360px. The test browser opted out first (`/no-contar`) so its visits don't mix with real ones; checks 5, 7 and 8 used curl with fresh cookie jars.

| # | Check | Result | Evidence |
|---|---|---|---|
| 1 | Default load: "No puedo", `sin_margen`, no earlier time | ✅ | "No puedo" pressed. "Respetamos tu hora. No te vamos a pedir salir antes." Below the limit question the only times on screen are 4:45 (usual) and 6:50 (arrival). Usual card "3 de cada 10". Day defaults to lunes (tomorrow). `scrollWidth` = 360. |
| 2 | Limit 15, usual 04:45, martes | ✅ | Card at 4:30, "7 de cada 10". Trade line: "Si estás en la parada 15 min antes: 7 de cada 10 veces fue sentado, contra 3 de cada 10 a tu hora." |
| 3 | Limit 15, arrive 06:00 | ✅ | "Dentro de tu margen (hasta 15 min antes) no hubo una hora…" plus the bad-day warning. No "1 h". With limit 60 it says "hasta 1 h antes". |
| 4 | Limit 60, usual 04:15 | ✅ | "A tu hora ya sueles ir sentado: 8 de cada 10." No suggestion. |
| 5 | `?limite=999&t=<script>` | ✅ | Falls back to "No puedo", page renders, no script in the DOM. curl: only `llego_vid` is set, no `llego_t`. |
| 6 | Banner line, "al trabajo", "estimado, no medido" | ✅ | "Ejemplo inventado para probar la app. Aún no son viajes reales." · "llegas al trabajo ~6:50" · "Metro + caminar: 75 min (estimado, no medido)". |
| 7 | `/?t=u3` → `view` row with `tester = 'u3'`; reload → second row, same `visitor_id` | ⏳ SQL | First response sets `llego_vid` and `llego_t=u3` (Secure, HttpOnly, SameSite=lax, 180 d / 90 d); the reload sets nothing new. Test visitor `7064af4b-ab9a-4950-813e-37e79eb8e8f0`, 04:58:48–49 UTC. Rows to be confirmed in the SQL editor. |
| 8 | `/no-contar`, then reload → no new rows | ⏳ SQL | Same jar: 307 to `/`, "Listo, ya no contamos tus visitas." once, then "No contamos tus visitas." Two reloads at 04:58:57 UTC that must add no rows. |
| 9 | Anon: select → 0 rows; direct insert → rejected; `log_event('hack', …)` → rejected | ✅ | REST with the publishable key: `events` select `[]`; insert → 42501 "new row violates row-level security policy"; `log_event` with `p_name = 'hack'` → 23514 `events_name_check`; `trips` select `[]`. |
| 10 | Log a ride → one `ride_logged` row; no `user_id` column in `events` | ⏳ Nico | Needs a Google sign-in. `events.sql` (applied verbatim) has no `user_id`, IP, user agent or location column; PostgREST doesn't publish the table's schema to anon. |
| 11 | Secrets grep | ✅ | `git grep -nE "service_role\|sb_secret\|eyJhbGci" -- ":!docs"` → nothing. |

Test rows that are not real riders, to leave out of `returning.sql` counts: visitor `7064af4b-ab9a-4950-813e-37e79eb8e8f0` (tester u3, check 7) and visitor `cdb36a21-c1e3-4808-9743-57165b96a80d` (check 5). Earlier, the local check of the empty table also confirmed the page renders while `log_event` doesn't exist yet: each view only printed "Could not find the function public.log_event…" to the server log.

### Bug found and fixed

| Bug | Why it matters | Fix |
|---|---|---|
| The suggestion card said **"sal a las 4:30"**, while 4:30 is the time to be at the stop | It contradicts the field "En la parada" and "No te vamos a pedir salir antes". A rider who walks 10 min to the stop and leaves home at 4:30 reaches it at 4:40 and gets the 4:45 odds, not the 4:30 ones. Week 12 already fixed the same confusion in the hint line (PERSONA_LOG). | The card now reads "en la parada a las" over the big time; the separate "Hora de estar en la parada" line went away as redundant. Checked at 360px locally and on production after the redeploy. |

---

## Week 12

Mechanical pass from PACKET §12, run on 1 Nov 2026 against production (https://llego-mx.vercel.app) at commit `917a251`. All 10 checks pass.

| # | Check | Result | Evidence |
|---|---|---|---|
| 1 | Answer on load with defaults, 360px, no horizontal scroll | ✅ | At 360px, `scrollWidth` = 360. Suggestion and usual cards render with no input. Day defaults to tomorrow (lunes). |
| 2 | 07:00, 04:45, martes | ✅ | "sal a las 4:30", "7 de cada 10 veces fue sentado", llegas ~6:30. A tu hora: "3 de cada 10", llegas ~6:50. "Cambias 15 min de sueño por ~33 min sentado". "Poco dato · 12 viajes". |
| 3 | Usual 04:15 | ✅ | "A tu hora ya sueles ir sentado: 8 de cada 10." No suggestion. Copy follows the prompt, not the PACKET's wording (see DECISIONS). |
| 4 | Arrive 06:00 | ✅ | "No encontramos una hora, hasta 1 h antes…" plus "Ojo: a tu hora, en un día malo, llegarías después de las 06:00." |
| 5 | Sábado or domingo | ✅ | Both: "Sin dato", no "de cada 10", no slot-level numbers. |
| 6 | Log a ride signed out | ✅ | `/registrar` and `/mis-viajes` redirect to `/entrar`. Google sign-in returned to `/registrar`. |
| 7 | `wait_min = -5`, `ride_min = 999`, seated blank | ✅ | Three inline errors: "Escribe un número entero de 0 a 180.", "…de 5 a 300.", "Dinos si fuiste sentado." Slot count unchanged. |
| 8 | Log a ride, delete it | ✅ | 05:00 laborable went 14 → 15, then back after Borrar. The success screen showed the same count. |
| 9 | Account B can't read A; anon can't select | ✅ | See below. |
| 10 | `git grep -nE "service_role\|sb_secret\|eyJhbGci"` | ✅ with a note | No matches outside `docs/`. Run literally, it matches two lines in `docs/PACKET.md` and `docs/IMPLEMENTATION_PROMPT.md`, which quote the pattern. |

The 14 in check 8 includes one ride from the second test account, deleted afterwards. After cleanup, all four slots match the prompt's table again (05:00: n = 13, seat_rate 0.2, p90 62).

## Check 9 in detail

Two real Google accounts, using account B's session directly against the REST API:

| Attempt as account B | Result |
|---|---|
| Select all of `trips` | Only B's own row; none of A's rows and no seed rows |
| Select, delete or update A's row by id | Empty result; nothing changed |
| Delete seed rows (`is_simulated = true`) | Empty result; nothing deleted |
| Insert with a `user_id` that isn't B's | 403, RLS violation |
| Insert with `is_simulated = true` | 403, RLS violation |

The forged insert used a uuid other than B's, not A's actual user id. The policy rejects any value other than `auth.uid()`, so the result is the same.

Anon client: `select` returns 0 rows, and `delete` on seed rows removes nothing. A's `/mis-viajes` listed only A's own ride, while B's ride counted in the aggregate.

RLS was confirmed by this behavior, not by opening the Supabase dashboard.

## Sign-out

"Salir" returns to `/`, removes the session cookies and hides the account bar. `/registrar` asks for sign-in again.

## Bugs found

| # | Bug | Status |
|---|---|---|
| 1 | Success screen showed "Volver al inicio" and "Volver" run together | Fixed in `917a251` |
| 2 | "Sentado: 0 de tus 1 viajes" (also "1 viajes" on the success screen) | Fixed in `917a251`, verified: "0 de tu 1 viaje" |
| 3 | Inter never loaded: the font variable was on `body`, but `--font-sans` resolves on `:root` | Fixed before commit 1 |
| 4 | Deploy #2 returned HTTP 500: the build ran before the env vars existed | Fixed with a new build; recorded in DECISIONS |
| 5 | Google sign-in from `localhost:4000` lands on production | Open. Production isn't affected |

## Not covered

- A real Android phone: 360px was emulated in a desktop browser.
- A new Google user while the consent screen is in Testing (see Open in DECISIONS).
- The Spanish error page (`error.tsx`), which appeared during the deploy #2 failure but has no test of its own.
