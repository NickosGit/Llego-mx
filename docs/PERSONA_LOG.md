# Persona log — ¿Llego?

Persona test from PACKET §12, run on 1 Nov 2026. A simulated Rodolfo, played by an AI agent with no context from the build, received the persona prompt and the text of 7 screens. **This is a simulation, not evidence from the real Rodolfo.**

## Outcome

**Would he leave earlier?** Yes, at 4:30, "solo de prueba". He kept "sal a las 4:30" and "7 de cada 10", and didn't believe the number: "le creo la dirección, más temprano es mejor, pero eso ya lo sabía".

**Where he would close it:** the simulated banner on opening (almost), the 06:00 no-suggestion screen, sábado's Sin dato, and the sign-in screen at 4 am ("ya tengo mi hora"). He got his answer before any sign-in was asked for.

## Worst confusion: fixed

**"Salir" of what: home or the stop?** "SUELES SALIR 04:45" and "sal a las 4:30" read as leaving home, but the form asks "¿A qué hora llegaste a la parada de la 120?". The data is bucketed by arrival at the stop. A rider who leaves home at 4:30 reaches the stop later than the slot he was told about, so this one makes him decide wrong without noticing.

**Fix:** the home screen now says, under the inputs, that the times mean being at the stop, and the green card repeats it next to the time. Mis viajes labels its time the same way. Not re-tested with the persona.

## All confusions

Severity is the persona's own. "Grave" means he closes it or decides wrong.

| # | Screen | Text | What he understood | Severity | Status |
|---|---|---|---|---|---|
| 1 | Home, success | "DATOS SIMULADOS" | The numbers may be invented; no banner on sábado means that screen is real; his real ride got mixed with fake ones | Grave | Open |
| 2 | Home, form | "SUELES SALIR", "sal a las 4:30" vs "llegaste a la parada" | Doesn't know if the time is home or the stop | Grave | **Fixed** |
| 3 | Home, Mis viajes | "DÍA martes" vs "dom 1 de nov" | Decided with the wrong day | Grave | Test artifact, see below |
| 4 | Llegar 06:00 | "No encontramos una hora, hasta 1 h antes…" | There's no way to sit, which contradicts the 4:30 he just saw; 1 h before what? | Grave | Open |
| 5 | Home | "Cambias 15 min de sueño por ~33 min sentado" | A sure trade, though 3 of 10 days he stands anyway, and at his own time he sometimes sits | Grave | Open |
| 6 | Home | "Poco dato · 12 viajes" under "sal a las 4:30" | A firm order, then "we barely know"; 12 rides of what? | Media | Open |
| 7 | Llegar 06:00 | "en un día malo, llegarías después de las 06:00" | The typical arrival is already 6:50, so it's late every day, not only on bad ones | Media | Open |
| 8 | Home | "(estimado de Rodolfo)" | They use his name and a number he didn't enter, or it's another Rodolfo | Media | Open |
| 9 | Home, success | "12 viajes", "14 viajes" | The count moves for no reason | Media | Open, partly an artifact |
| 10 | Sign-in, form | "solo sirve para guardar" vs "llegan sumados" | He was told only to store, then that it also feeds the forecast | Media | Open |
| 11 | Home | "llegas ~6:30" | Arrive where: El Rosario or work? Had to add the 75 min | Media | Open |
| 12 | Sábado | "Registra el tuyo y ayuda…" | No answer, and he's asked to do the work | Media | Open |
| 13 | Form | "Minutos en la fila" | Understands it, but doesn't time rides, so he'll estimate | Media | Open |
| 14 | Success | "Esta franja" | The yellow band? | Leve | Open |
| 15 | Home | "Necesitas entrar con Google" | At a glance, an account for everything | Leve | Open |
| 16 | Form | "Salir" | For a second, about leaving time | Leve | Open |
| 17 | Mis viajes | "Sentado: 0 de tu 1 viaje" | Reads oddly, still clear | Leve | Open |
| 18 | Mis viajes | "dom 1 de nov · 5:00" | A loose time, not saying of what | Leve | **Fixed** with #2 |
| 19 | Home | "¿Llego?" | He'll arrive; his question is whether he sits | Leve | Open |

## Reading these honestly

- **#3 comes from how the test was set up.** The pasted screen said "martes" so it would match the mockup, while the ride shown was dated Sunday. The live app defaults to tomorrow and would have shown lunes. The real gap, that nothing says which day he's looking at beyond the small field, wasn't tested.
- **#9 is partly the same.** The 14 on the success screen was an example count. The 12 → 14 change is real: the pill uses the lowest count of the slots on screen, and that set changes.
- **#1 is the persona being right.** The data is simulated, and the prompt requires the banner. Not believing the number is the honest reaction until real rides exist. What's open is that the banner doesn't explain itself.

## Found by this test: for the real Rodolfo

His baseline says he **leaves home** at 4:45, and `usualDepart` uses that as a slot that means **reaching the stop**. If the walk to the Walmart takes real time, his true slot is later than 04:45 and the comparison is off by that walk. The home-to-stop time isn't in the PACKET. See Open in DECISIONS.
