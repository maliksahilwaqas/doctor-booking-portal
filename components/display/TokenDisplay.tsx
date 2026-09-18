"use client";

import { useEffect, useRef, useState } from "react";
import { todayISO } from "@/lib/calc/schedule";

const POLL_MS = 10000;
const BLINK_MS = 45000;

/**
 * The waiting-room screen -- a TV or monitor with this URL open, nothing
 * else, meant to be opened once and left running for hours or days
 * unattended. That constraint shapes everything here:
 *
 * - Polling is a self-scheduling loop (poll, then schedule the next poll
 *   only once this one finishes), not setInterval. setInterval keeps
 *   firing on its own clock even if a fetch is slow, which can pile up
 *   overlapping requests; this can't ever have two in flight at once.
 * - "Today" is recomputed on every poll (the clinic's calendar day, the
 *   same todayISO() the server uses) instead of trusting the date the page
 *   happened to load with, so a screen left open across midnight follows
 *   the new day's queue on its own.
 * - visibilitychange/focus/online listeners force an immediate poll (and
 *   reset the schedule so it doesn't also fire a second one moments
 *   later) whenever the tab wakes up -- covers a browser backgrounding
 *   the tab's timer, a laptop waking from sleep, or Wi-Fi dropping and
 *   coming back, none of which should mean waiting out a stale cycle.
 * - A failed fetch is silently retried next cycle -- the room's status
 *   doesn't change just because one request timed out.
 *
 * Blinks for 45 seconds the moment the token number changes. No login,
 * no chrome, no other data -- just the number.
 */
export function TokenDisplay({
  locationId,
  initialTokenNumber,
}: {
  locationId: string;
  initialTokenNumber: number | null;
}) {
  const [tokenNumber, setTokenNumber] = useState<number | null>(initialTokenNumber);
  const [blinking, setBlinking] = useState(false);
  const prevToken = useRef<number | null>(initialTokenNumber);
  const blinkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    let nextPollTimer: ReturnType<typeof setTimeout> | null = null;

    async function poll() {
      try {
        const today = todayISO();
        const res = await fetch(`/api/now-serving?locationId=${locationId}&date=${today}`, { cache: "no-store" });
        if (!cancelled && res.ok) {
          const data = await res.json();
          setTokenNumber(data.tokenNumber ?? null);
        }
      } catch {
        // Network blip -- next cycle tries again; the screen just keeps showing the last known token.
      } finally {
        if (!cancelled) nextPollTimer = setTimeout(poll, POLL_MS);
      }
    }

    function pollNow() {
      if (nextPollTimer) clearTimeout(nextPollTimer);
      void poll();
    }

    poll();
    function onWake() {
      if (document.visibilityState === "visible") pollNow();
    }
    document.addEventListener("visibilitychange", onWake);
    window.addEventListener("focus", onWake);
    window.addEventListener("online", onWake);

    return () => {
      cancelled = true;
      if (nextPollTimer) clearTimeout(nextPollTimer);
      document.removeEventListener("visibilitychange", onWake);
      window.removeEventListener("focus", onWake);
      window.removeEventListener("online", onWake);
    };
  }, [locationId]);

  useEffect(() => {
    if (tokenNumber !== null && tokenNumber !== prevToken.current) {
      prevToken.current = tokenNumber;
      setBlinking(true);
      if (blinkTimer.current) clearTimeout(blinkTimer.current);
      blinkTimer.current = setTimeout(() => setBlinking(false), BLINK_MS);
    }
  }, [tokenNumber]);

  useEffect(
    () => () => {
      if (blinkTimer.current) clearTimeout(blinkTimer.current);
    },
    [],
  );

  return (
    <div
      className="flex min-h-dvh items-center justify-center"
      style={{
        background: "var(--ink)",
        color: "var(--bg)",
        animation: blinking ? "display-blink 1s steps(1,end) infinite" : "none",
      }}
    >
      <div className="text-[28vw] leading-none font-extrabold tracking-tight">
        {tokenNumber !== null ? `T${tokenNumber}` : "—"}
      </div>
    </div>
  );
}
