"use client";

import { useEffect, useRef, useState } from "react";

const POLL_MS = 30000;
const BLINK_MS = 45000;

/**
 * The waiting-room screen -- a TV or monitor with this URL open, nothing
 * else. Polls app/api/now-serving/route.ts (the same route the reception
 * queue banner and doctor dashboard poll) every 30 seconds for whichever
 * token is currently 'in_room', and blinks for 45 seconds the moment a new
 * token appears here, however long the previous poll took to notice it.
 * No login, no chrome, no other data -- just the number.
 *
 * Two things matter for a screen meant to run unattended for hours:
 * "today" is recomputed on every poll (UTC date, matching todayISO()
 * server-side) instead of trusting the date the page happened to load
 * with, so a display left open across midnight rolls to the new day's
 * queue on its own instead of querying a date that's gone stale. And a
 * `visibilitychange` listener forces an immediate poll the moment the tab
 * regains focus, since browsers throttle background-tab timers and a
 * screen that was backgrounded (another app in front, laptop woken from
 * sleep) shouldn't have to wait out a stale interval to catch up.
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
    let ignore = false;
    const poll = () => {
      const today = new Date().toISOString().slice(0, 10);
      fetch(`/api/now-serving?locationId=${locationId}&date=${today}`)
        .then((r) => r.json())
        .then((data) => {
          if (!ignore) setTokenNumber(data.tokenNumber);
        })
        .catch(() => {});
    };
    poll();
    const id = setInterval(poll, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") poll();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      ignore = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
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
