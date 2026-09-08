"use client";

import { useTransition } from "react";
import { confirmRequest, declineRequest } from "@/actions/reception";
import { formatMoney } from "@/lib/calc/format";
import type { BookingRow } from "@/lib/data/bookings";
import type { CurrencyCode } from "@/types/database.types";

function timeAgo(createdAt: string): string {
  const ms = Date.now() - new Date(createdAt).getTime();
  const mins = Math.max(0, Math.round(ms / 60000));
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  return `${hrs} hr${hrs === 1 ? "" : "s"} ago`;
}

export function RequestsTab({
  requests,
  locationNames,
  currency,
}: {
  requests: BookingRow[];
  locationNames: Record<string, string>;
  currency: CurrencyCode;
}) {
  const [pending, startTransition] = useTransition();

  if (requests.length === 0) {
    return <div className="border border-divider bg-surface p-4 text-sm text-muted">No pending requests.</div>;
  }

  return (
    <div className="flex flex-col gap-2.5">
      {requests.map((r) => (
        <div key={r.id} className="border border-divider">
          <div className="flex justify-between border-b border-divider px-3 py-2.5">
            <div>
              <div className="text-[15px] font-extrabold">{r.patientName}</div>
              <div className="text-[11.5px] font-bold">{r.patientPhone}</div>
              <div className="text-[11.5px] text-muted">
                {locationNames[r.locationId] ?? "Location"} · {r.visitDate} · token {r.tokenNumber}
              </div>
            </div>
          </div>
          <div className="flex justify-between px-3 py-2.5 text-[12.5px]">
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted">Fee</div>
              <div className="text-[15px] font-extrabold">{formatMoney(r.fee, currency)}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted">Requested</div>
              <div className="text-[15px] font-extrabold">{timeAgo(r.createdAt)}</div>
            </div>
          </div>
          <div className="flex border-t border-divider">
            <button
              disabled={pending}
              onClick={() => startTransition(() => void confirmRequest(r.id))}
              className="flex-1 cursor-pointer bg-accent px-3 py-2.5 text-[13px] font-extrabold text-white"
            >
              CONFIRM · TOKEN {r.tokenNumber}
            </button>
            <button
              disabled={pending}
              onClick={() => startTransition(() => void declineRequest(r.id))}
              className="cursor-pointer border-l border-divider px-3 py-2.5 text-[13px] font-extrabold"
            >
              DECLINE
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
