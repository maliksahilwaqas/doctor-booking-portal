import { formatTime } from "./format";

export interface TokenLocation {
  fromMin: number;
  toMin: number;
  slotMin: number;
}

/**
 * How many tokens a session has -- floor((to-from)/slot), numbered 1..n.
 * The tiny epsilon guards against a "by patient count" slot length like
 * 120/36 = 3.3333333333333335 (floating-point, not exactly 10/3) coming
 * back as 35.999999999999996 and flooring one token short of what the
 * doctor actually asked for.
 */
export function tokenCount(loc: TokenLocation): number {
  return Math.floor((loc.toMin - loc.fromMin) / loc.slotMin + 1e-9);
}

/** Rounded to a whole minute for display -- slotMin itself may be fractional (see tokenCount above), but a token's clock time always shows as clean HH:MM. */
export function tokenStartMinutes(loc: TokenLocation, tokenNumber: number): number {
  return Math.round(loc.fromMin + (tokenNumber - 1) * loc.slotMin);
}

export function tokenTime(loc: TokenLocation, tokenNumber: number): string {
  return formatTime(tokenStartMinutes(loc, tokenNumber));
}
