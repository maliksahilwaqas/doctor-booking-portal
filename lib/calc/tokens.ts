import { formatTime } from "./format";

export interface TokenLocation {
  fromMin: number;
  toMin: number;
  slotMin: number;
}

/** How many tokens a session has -- floor((to-from)/slot), numbered 1..n. */
export function tokenCount(loc: TokenLocation): number {
  return Math.floor((loc.toMin - loc.fromMin) / loc.slotMin);
}

export function tokenStartMinutes(loc: TokenLocation, tokenNumber: number): number {
  return loc.fromMin + (tokenNumber - 1) * loc.slotMin;
}

export function tokenTime(loc: TokenLocation, tokenNumber: number): string {
  return formatTime(tokenStartMinutes(loc, tokenNumber));
}
