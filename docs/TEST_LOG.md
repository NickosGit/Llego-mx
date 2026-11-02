# Test log — ¿Llego?

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
