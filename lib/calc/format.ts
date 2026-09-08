import type { CurrencyCode } from "@/types/database.types";

/** Minutes-since-midnight -> "HH:MM", 24-hour. */
export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function formatMoney(amount: number, currency: CurrencyCode): string {
  return `${currency} ${amount.toLocaleString("en-US")}`;
}
