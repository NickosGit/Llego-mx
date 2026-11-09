# Persona log — ¿Llego?

## Week 13 — a stranger (PACKET §12b)

Run on 8 Nov 2026. Fresh chat, no build context. Persona: **a 34-year-old cashier downtown, starts at 8:00, rides the 120 from Las Alamedas, doesn't know any Rodolfo, opens a WhatsApp link at 5 am in the line.** She got the text of 5 screens from production after commit 4 (`8e70eed`). Raw answer: [`PERSONA_W13_RAW.md`](PERSONA_W13_RAW.md). **A simulation, not evidence from a real rider.**

### Outcome

**Would she change anything tomorrow?** No. She keeps 5:00 at the stop: "no me voy a levantar más temprano por un ejemplo", and screen 3 contradicts itself. With real data and more rides she would try 4:30 one day: "7 de cada 10 sentada y llegar antes sí vale la pena".

**Where she'd close it:** screen 3, at "Ojo: a tu hora, en un día malo, llegarías después de las 06:00" right under "llegas al trabajo ~6:50".

**What now works:** the trade line ("Esta sí la entiendo"), the limit and "Respetamos tu hora" ("Bueno, está bien"), "estimado, no medido" ("está bien que lo digan"), and the opt-out ("me dio confianza… que se viera que hizo caso"). What she distrusts is the Google sign-in, not the visit count.

### Confusions, checked against the code

"Real" = the screen really says something wrong or misleading. "Artifact" = it comes from getting text instead of the live page.

| # | Screen | Text | What she understood | Severity | Real or artifact | Status |
|---|---|---|---|---|---|---|
| 1 | All | "DATOS SIMULADOS. Ejemplo inventado…" | Everything below is fake, so there's nothing to decide | Grave | **Real, and expected.** The disclosure works (she trusts it) and it kills the decision. Real riders in the sessions will meet the same banner | Open: product, not copy |
| 2 | All | "EN LA PARADA 04:45" | Someone else's time (she's at the stop at 5:00), so every number is for another person | Grave | **Mostly artifact.** On the live page it's a dropdown she can change. Still real that nothing says "pon tu hora" | Open: watch in sessions |
| 3 | 3 | "no hubo una hora en la que la mayoría de las veces se fuera sentado" | Contradicts screen 2, where 4:30 was 7 de cada 10 | Grave | **Real bug.** With LLEGAR 06:00, 4:30 is still 7 de cada 10 but fails the bad-day arrival check. The message blames seats when the reason is time. Week 12 #4 | **Fixed:** "…sí hubo horas en que la mayoría de las veces se fue sentado, pero con ellas normalmente llegarías después de las 6:00" |
| 4 | 3 | "Ojo: … en un día malo, llegarías después de las 06:00" | The typical arrival (6:50) is already after 6:00, so "un día malo" makes no sense | Grave | **Real bug.** The warning fires when the p90 is late, and says "en un día malo" even when the *typical* arrival is late too. Week 12 #7 | **Fixed:** "Ojo: a tu hora, normalmente llegarías después de las 6:00"; "en un día malo" only when the typical day is on time |
| 5 | 3 | (no next step) | Tells her she won't make it but not what to do | Media | Real | Open |
| 6 | All | "LLEGAR 07:00" | Arrive where? Guessed "al trabajo" from below | Media | Real | Open |
| 7 | 1 | "3 de cada 10 veces fue sentado" | Who? Other people, she supposes | Media | Real, mild | Open |
| 8 | 1 | "Necesitas entrar con Google" | Won't hand her account to an unknown site | Media | Real | Open (Week 12 #15) |
| 9 | 1–4 | "Poco dato · 15 / 12 / 15 / 13 viajes" | Why does the count change on the same route? | Media | Real: the label is the smaller n of the slots shown | Open (Week 12 #6, #9) |
| 10 | 2 | "en la parada a las 4:30" | 15 min before *their* time, 30 min before hers | Media | Artifact of #2: with her own 5:00, 15 min earlier is 4:45 | — |
| 11 | 5 | Back to screen 1 with "No puedo" | Opting out erased her choices | Media | **Real bug.** `/no-contar` redirects to `/` and drops the query params | **Fixed:** the link carries the 4 plan params and `/no-contar` sends them back (never `?t=`) |
| 12 | All | "DÍA martes" | Is tomorrow Tuesday? | Leve | Artifact: the live page defaults to tomorrow | — |
| 13 | All | "sin que te cueste" | Money or effort? Guessed effort | Leve | Real, mild | Open |
| 14 | 4 | "A tu hora ya sueles ir sentado" | As if it knew her; and nothing about leaving at 4 in the dark | Leve | Real | Open |
| 15 | 1 | "(estimado, no medido)" | Understood, and fine that they say it | Leve | — | Week 12 #8 **resolved** |

### Against Week 12

| Week 12 | Now |
|---|---|
| #1 banner: maybe invented | Understood exactly, and trusted. Now it stops the decision instead (#1) |
| #4 06:00 message | Still grave in the pass (#3), **fixed after it** |
| #5 trade line read as certain | **Resolved:** read as past odds |
| #7 "en un día malo" | Still grave in the pass (#4), where she'd close it; **fixed after it** |
| #8 "estimado de Rodolfo" | **Resolved** |
| #11 "llegas ~6:30" where? | **Resolved** ("llegas al trabajo"), and helped her decode LLEGAR |

### Reading it honestly

- **Three real bugs (#3, #4, #11), all fixed before the real sessions.** #3 and #4 sat on the same screen, where she'd close the app. Not re-tested with the persona.
- **#1 is the big one, and it isn't a bug.** Honest disclosure of simulated data makes the answer not change what she does. If the real sessions say the same, that's the "the answer doesn't change what I do" case: a product decision, not a fix.

---

## Week 12

Persona test from PACKET §12, run on 1 Nov 2026. A simulated Rodolfo, played by an AI agent with no context from the build, received the persona prompt and the text of 7 screens. **This is a simulation, not evidence from the real Rodolfo.**

### Outcome

**Would he leave earlier?** Yes, at 4:30, "solo de prueba". He kept "sal a las 4:30" and "7 de cada 10", and didn't believe the number: "le creo la dirección, más temprano es mejor, pero eso ya lo sabía".

**Where he would close it:** the simulated banner on opening (almost), the 06:00 no-suggestion screen, sábado's Sin dato, and the sign-in screen at 4 am ("ya tengo mi hora"). He got his answer before any sign-in was asked for.

### Worst confusion: fixed

**"Salir" of what: home or the stop?** "SUELES SALIR 04:45" and "sal a las 4:30" read as leaving home, but the form asks "¿A qué hora llegaste a la parada de la 120?". The data is bucketed by arrival at the stop. A rider who leaves home at 4:30 reaches the stop later than the slot he was told about, so this one makes him decide wrong without noticing.

**Fix:** the home screen now says, under the inputs, that the times mean being at the stop, and the green card repeats it next to the time. Mis viajes labels its time the same way. Not re-tested with the persona.

### All confusions

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

### Reading these honestly

- **#3 comes from how the test was set up.** The pasted screen said "martes" so it would match the mockup, while the ride shown was dated Sunday. The live app defaults to tomorrow and would have shown lunes. The real gap, that nothing says which day he's looking at beyond the small field, wasn't tested.
- **#9 is partly the same.** The 14 on the success screen was an example count. The 12 → 14 change is real: the pill uses the lowest count of the slots on screen, and that set changes.
- **#1 is the persona being right.** The data is simulated, and the prompt requires the banner. Not believing the number is the honest reaction until real rides exist. What's open is that the banner doesn't explain itself.

### Found by this test: for the real Rodolfo

His baseline says he **leaves home** at 4:45, and `usualDepart` uses that as a slot that means **reaching the stop**. If the walk to the Walmart takes real time, his true slot is later than 04:45 and the comparison is off by that walk. The home-to-stop time isn't in the PACKET. See Open in DECISIONS.
