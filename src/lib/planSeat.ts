import type { corridor } from "@/config/corridor";
import type { DayType, ForecastCell } from "@/lib/forecast";

export type PlanState = "sin_dato" | "ya_sentado" | "sugerencia" | "sin_sugerencia";

export type UsualSlot = {
  slot: string;
  seatOutOf10: number;
  p50_wait: number;
  arrival: string;
  badDayArrival: string; // p90, rounded UP so a bad day is never shown better than it is
  onTime: boolean;
  n: number;
};

export type SuggestedSlot = {
  slot: string;
  seatOutOf10: number;
  p50_wait: number;
  arrival: string;
  minutesEarlier: number;
  seatedMin: number;
  n: number;
};

export type Plan = {
  state: PlanState;
  usual: UsualSlot | null; // null when the usual slot has no data
  suggestion: SuggestedSlot | null;
  label: { text: "Buen dato" | "Poco dato" | "Sin dato"; n: number };
  badDayWarning: boolean;
  hasSimulated: boolean;
};

type PlanInput = {
  arriveBy: string;
  usualDepart: string;
  // How much earlier the rider says they can be at the stop. 0 = never ask them to sleep less.
  maxEarlierMin: number;
  dayType: DayType;
  config: typeof corridor;
  forecast: (dayType: DayType, slot: string) => ForecastCell;
};

type CellWithData = ForecastCell & {
  seat_rate: number;
  p50_wait: number;
  p50_ride: number;
  p90_total: number;
};

const SLOT_MIN = 15;
const MIN_RIDES = 10;

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function toSlot(minutes: number): string {
  const h = Math.floor(minutes / 60);
  return `${String(h).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

// "04:30" -> "4:30"
export function formatClock(hhmm: string): string {
  return hhmm.replace(/^0/, "");
}

function round5(minutes: number): number {
  return Math.round(minutes / 5) * 5;
}

function ceil5(minutes: number): number {
  return Math.ceil(minutes / 5) * 5;
}

function hasData(cell: ForecastCell): cell is CellWithData {
  return cell.n >= MIN_RIDES && cell.seat_rate !== null;
}

// Earlier slots to search, latest first. The day starts at 00:00: nothing wraps to the night before.
export function earlierSlots(usualDepart: string, searchWindowMin: number): string[] {
  const usual = toMinutes(usualDepart);
  const slots: string[] = [];
  for (let back = SLOT_MIN; back <= searchWindowMin && usual - back >= 0; back += SLOT_MIN) {
    slots.push(toSlot(usual - back));
  }
  return slots;
}

function labelFor(n: number): Plan["label"] {
  return { text: n >= 30 ? "Buen dato" : "Poco dato", n };
}

// The rider's own limit wins, and it can never go past the corridor's hard cap.
export function searchWindow(maxEarlierMin: number, config: typeof corridor): number {
  return Math.max(0, Math.min(maxEarlierMin, config.searchWindowMin));
}

export function planSeat({
  arriveBy,
  usualDepart,
  maxEarlierMin,
  dayType,
  config,
  forecast,
}: PlanInput): Plan {
  const target = toMinutes(arriveBy) - config.restOfTripMin; // must reach El Rosario by this
  const onTime = (slot: string, c: CellWithData) => toMinutes(slot) + c.p90_total <= target;
  const arrival = (slot: string, c: CellWithData) =>
    formatClock(toSlot(round5(toMinutes(slot) + c.p50_wait + c.p50_ride + config.restOfTripMin)));
  const seatOutOf10 = (c: CellWithData) => Math.round(c.seat_rate * 10);

  const usualCell = forecast(dayType, usualDepart);
  if (!hasData(usualCell)) {
    return {
      state: "sin_dato",
      usual: null,
      suggestion: null,
      label: { text: "Sin dato", n: usualCell.n },
      badDayWarning: false,
      hasSimulated: usualCell.has_simulated,
    };
  }

  const usualOnTime = onTime(usualDepart, usualCell);
  const usual: UsualSlot = {
    slot: usualDepart,
    seatOutOf10: seatOutOf10(usualCell),
    p50_wait: usualCell.p50_wait,
    arrival: arrival(usualDepart, usualCell),
    badDayArrival: formatClock(
      toSlot(ceil5(toMinutes(usualDepart) + usualCell.p90_total + config.restOfTripMin)),
    ),
    onTime: usualOnTime,
    n: usualCell.n,
  };
  const badDayWarning = !usualOnTime;

  if (usualCell.seat_rate >= config.seatGoal && usualOnTime) {
    return {
      state: "ya_sentado",
      usual,
      suggestion: null,
      label: labelFor(usualCell.n),
      badDayWarning,
      hasSimulated: usualCell.has_simulated,
    };
  }

  let hasSimulated = usualCell.has_simulated;
  for (const slot of earlierSlots(usualDepart, searchWindow(maxEarlierMin, config))) {
    const cell = forecast(dayType, slot);
    hasSimulated ||= cell.has_simulated;
    if (hasData(cell) && cell.seat_rate >= config.seatGoal && onTime(slot, cell)) {
      return {
        state: "sugerencia",
        usual,
        suggestion: {
          slot,
          seatOutOf10: seatOutOf10(cell),
          p50_wait: cell.p50_wait,
          arrival: arrival(slot, cell),
          minutesEarlier: toMinutes(usualDepart) - toMinutes(slot),
          seatedMin: cell.p50_ride,
          n: cell.n,
        },
        label: labelFor(Math.min(usualCell.n, cell.n)),
        badDayWarning,
        hasSimulated,
      };
    }
  }

  return {
    state: "sin_sugerencia",
    usual,
    suggestion: null,
    label: labelFor(usualCell.n),
    badDayWarning,
    hasSimulated,
  };
}
