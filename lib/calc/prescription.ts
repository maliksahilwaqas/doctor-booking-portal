import type { PrescriptionItem } from "@/types/database.types";

export function doseLabel(item: PrescriptionItem): string {
  if (item.morning && item.night) return "Morning and night";
  if (item.morning) return "Morning";
  if (item.night) return "Night";
  return "As directed";
}

export function followUpLabel(days: number | null): string | null {
  return days === null ? null : `Follow up in ${days} days`;
}
