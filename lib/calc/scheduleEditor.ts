import { formatTime } from "./format";

export interface SessionPreview {
  tokenCount: number;
  slotMinutesDisplay: number;
  lastTokenTime: string;
  /** The whole-minute slot length that actually produces `tokenCount` tokens -- what a save must persist for "by patient count" mode, since the schema only ever stores a slot length. */
  effectiveSlotMin: number;
}

/**
 * Live preview shown while the doctor/admin edits a session's hours --
 * "divide by slot length" fixes the per-patient minutes and derives the
 * token count; "divide by patient count" does the reverse.
 */
export function computeSessionPreview(
  fromMin: number,
  toMin: number,
  mode: "slot" | "count",
  slotMin: number,
  count: number,
): SessionPreview {
  const range = toMin - fromMin;
  const tokenCount = mode === "slot" ? Math.floor(range / slotMin) : count;
  const slotMinutesDisplay = mode === "slot" ? slotMin : Math.round((range / count) * 10) / 10;
  const effectiveSlot = tokenCount > 0 ? Math.floor(range / tokenCount) : 0;
  const lastTokenTime = formatTime(fromMin + Math.max(0, tokenCount - 1) * effectiveSlot);
  return { tokenCount, slotMinutesDisplay, lastTokenTime, effectiveSlotMin: effectiveSlot };
}
