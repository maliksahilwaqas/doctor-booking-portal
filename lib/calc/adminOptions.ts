import type { CurrencyCode, LocationTerm, SessionLabelStyle } from "@/types/database.types";

// Fixed option rings the Platform Admin cycles through by tapping a value --
// exactly the choices in the Claude Design mockup's `varDefs`/`HOUR_SETS`/`FEES`.

export const SESSION_LABEL_OPTIONS: SessionLabelStyle[] = ["morning_evening", "am_pm", "numbered"];
export const LOCATION_TERM_OPTIONS: LocationTerm[] = ["hospital", "clinic", "branch"];
export const CURRENCY_OPTIONS: CurrencyCode[] = ["PKR", "AED", "USD"];
export const BOOKING_WINDOW_OPTIONS = [45, 14, 90];
export const OVERBOOK_OPTIONS = [2, 0, 4];

export const HOUR_SET_OPTIONS: [number, number][] = [
  [540, 720],
  [600, 780],
  [1080, 1260],
  [960, 1200],
];
export const FEE_OPTIONS = [1500, 2000, 2500, 3000, 3500, 4000];
export const SLOT_MINUTE_OPTIONS = [5, 10, 15, 20, 30];

export function nextInRing<T>(ring: T[], current: T): T {
  const i = ring.findIndex((v) => v === current);
  return ring[(i + 1 + ring.length) % ring.length];
}
