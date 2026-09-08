"use client";

import { useEffect, useState, useTransition } from "react";
import { callNextToken } from "@/actions/reception";

interface NowServingState {
  tokenNumber: number | null;
  patientName: string | null;
}

const POLL_MS = 4000;

// Callers must pass a `key` derived from locationId+visitDate (see QueueTab)
// so switching location/date remounts this component -- that's what resets
// `serving` to the new `initial` prop, rather than an effect syncing it.
export function NowServingBanner({
  locationId,
  visitDate,
  initial,
  waitingCount,
}: {
  locationId: string;
  visitDate: string;
  initial: NowServingState;
  waitingCount: number;
}) {
  const [serving, setServing] = useState<NowServingState>(initial);
  const [pending, startTransition] = useTransition();

  // Polls the same route the doctor dashboard (and later a public queue-call
  // display) use, so this banner stays in sync even when another reception
  // terminal is the one calling the next token.
  useEffect(() => {
    let ignore = false;
    const poll = () => {
      fetch(`/api/now-serving?locationId=${locationId}&date=${visitDate}`)
        .then((r) => r.json())
        .then((data) => {
          if (!ignore) setServing({ tokenNumber: data.tokenNumber, patientName: data.patientName });
        })
        .catch(() => {});
    };
    const id = setInterval(poll, POLL_MS);
    return () => {
      ignore = true;
      clearInterval(id);
    };
  }, [locationId, visitDate]);

  function callNext() {
    startTransition(async () => {
      await callNextToken({ locationId, visitDate });
    });
  }

  return (
    <div className="mb-4 bg-ink px-3 py-3 text-bg">
      {serving.tokenNumber ? (
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-[10px] tracking-[0.1em] opacity-70">TOKEN {serving.tokenNumber}</div>
            <div className="text-[19px] font-extrabold">{serving.patientName ?? "In room"}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] tracking-[0.1em] opacity-70">IN ROOM</div>
          </div>
        </div>
      ) : (
        <div className="text-[13px] font-bold opacity-80">No one in the room right now.</div>
      )}
      <button
        disabled={pending || waitingCount === 0}
        onClick={callNext}
        className="mt-3 w-full cursor-pointer bg-accent px-3 py-2.5 text-[13px] font-extrabold disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending ? "CALLING…" : "CALL NEXT TOKEN"}
      </button>
    </div>
  );
}
