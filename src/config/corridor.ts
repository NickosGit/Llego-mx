export const corridor = {
  route: "Ruta 120",
  origin: "Walmart Las Alamedas (Atizapán)",
  transferPoint: "Metro El Rosario",
  destination: "Cámara de Diputados (San Lázaro)",
  restOfTripMin: 75,        // Metro L6→L5→L1 + walk. Rodolfo's estimate (Oct 2026), shown as "estimado, no medido"
  defaults: { arriveBy: "07:00", usualDepart: "04:45" },
  seatGoal: 0.6,            // "most days" = 6 of 10 or more
  searchWindowMin: 60,      // never suggest leaving more than 1 h earlier than usual
};
