"use client";

import { useEffect, useRef, useState } from "react";

const POLL_MS = 60000;
const BLINK_MS = 45000;

/**
 * The waiting-room screen -- a TV or monitor with this URL open, nothing
 * else. Polls app/api/now-serving/route.ts (the same route the reception
 * queue banner and doctor dashboard poll) once a minute for whichever
 * token is currently 'in_room', and blinks for 45 seconds the moment a new
 * token appears here, however long the previous poll took to notice it.
 * No login, no chrome, no other data -- just the number.
 */
export function TokenDisplay({
  locationId,
  visitDate,
  initialTokenNumber,
}: {
  locationId: string;
  visitDate: string;
  initialTokenNumber: number | null;
}) {
  const [tokenNumber, setTokenNumber] = useState<number | null>(initialTokenNumber);
  const [blinking, setBlinking] = useState(false);
  const prevToken = useRef<number | null>(initialTokenNumber);
  const blinkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let ignore = false;
    const poll = () => {
      fetch(`/api/now-serving?locationId=${locationId}&date=${visitDate}`)
        .then((r) => r.json())
        .then((data) => {
          if (!ignore) setTokenNumber(data.tokenNumber);
        })
        .catch(() => {});
    };
    poll();
    const id = setInterval(poll, POLL_MS);
    return () => {
      ignore = true;
      clearInterval(id);
    };
  }, [locationId, visitDate]);

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
