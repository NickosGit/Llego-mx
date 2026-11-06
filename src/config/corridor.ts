export const corridor = {
  route: "Ruta 120",
  origin: "Walmart Las Alamedas (Atizapán)",
  transferPoint: "Metro El Rosario",
  destination: "Cámara de Diputados (San Lázaro)",
  restOfTripMin: 75,        // Metro L6→L5→L1 + walk. Rodolfo's estimate, shown as "estimado de Rodolfo"
  defaults: { arriveBy: "07:00", usualDepart: "04:45" },
  seatGoal: 0.6,            // "most days" = 6 of 10 or more
  searchWindowMin: 60,      // hard cap: never more than 1 h earlier, even if the rider allows more
  earlierOptions: [0, 15, 30, 45, 60], // "¿Puedes llegar antes a la parada?" Default 0 (W13 fix)
};
