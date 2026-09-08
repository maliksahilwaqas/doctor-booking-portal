"use client";

import { useState, useTransition } from "react";
import { addLocation, cycleLocationField, removeLocation } from "@/actions/admin";
import { tokenCount } from "@/lib/calc/tokens";
import { formatMoney, formatTime } from "@/lib/calc/format";
import { DOW_SHORT } from "@/lib/calc/schedule";
import { CtaBar } from "@/components/ui/primitives";
import type { CurrencyCode, SessionName } from "@/types/database.types";

export interface AdminLocation {
  id: string;
  name: string;
  area: string;
  session: SessionName;
  days: number[];
  fromMin: number;
  toMin: number;
  slotMin: number;
  fee: number;
  active: boolean;
}

export function LocationsTab({ locations, currency }: { locations: AdminLocation[]; currency: CurrencyCode }) {
  const [pending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);

  async function onAdd() {
    setAdding(true);
    await addLocation();
    setAdding(false);
  }

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <div className="text-[11px] font-extrabold uppercase tracking-[0.1em]">Locations</div>
        <div className="text-[11.5px] text-muted">
          {locations.length} location{locations.length === 1 ? "" : "s"}
        </div>
      </div>

      <div className="mt-2 flex flex-col gap-2.5">
        {locations.map((l) => (
          <div key={l.id} className="border border-divider">
            <div className="flex items-center justify-between border-b border-divider px-3 py-2.5">
              <div>
                <div className="text-sm font-extrabold">{l.name}</div>
                <div className="text-[11.5px] text-muted">
                  {l.active ? "" : "OFF · "}
                  {l.session} · {l.days.map((d) => DOW_SHORT[d - 1]).join(", ")}
                </div>
              </div>
              <button
                disabled={pending}
                onClick={() => startTransition(() => void removeLocation(l.id))}
                className="cursor-pointer border border-divider px-2.5 py-1.5 text-[11.5px] font-extrabold"
              >
                REMOVE
              </button>
            </div>
            <div className="grid grid-cols-3 gap-px bg-divider">
              <button
                disabled={pending}
                onClick={() => startTransition(() => void cycleLocationField(l.id, "hours"))}
                className="cursor-pointer bg-bg px-2.5 py-2 text-left"
              >
                <div className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-muted">SITS</div>
                <div className="text-[13.5px] font-extrabold">
                  {formatTime(l.fromMin)}–{formatTime(l.toMin)}
                </div>
              </button>
              <button
                disabled={pending}
                onClick={() => startTransition(() => void cycleLocationField(l.id, "slot"))}
                className="cursor-pointer bg-bg px-2.5 py-2 text-left"
              >
                <div className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-muted">SLOT</div>
                <div className="text-[13.5px] font-extrabold">{l.slotMin} min</div>
              </button>
              <button
                disabled={pending}
                onClick={() => startTransition(() => void cycleLocationField(l.id, "fee"))}
                className="cursor-pointer bg-bg px-2.5 py-2 text-left"
              >
                <div className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-muted">FEE</div>
                <div className="text-[13.5px] font-extrabold">{formatMoney(l.fee, currency)}</div>
              </button>
            </div>
            <div className="border-t border-divider px-3 py-2 text-[11px] text-muted">
              {tokenCount(l)} tokens per session · fee auto-applied when a token is booked
            </div>
          </div>
        ))}
      </div>

      <CtaBar className="mt-3" disabled={adding} onClick={onAdd}>
        <span>{adding ? "ADDING…" : "+ ADD LOCATION"}</span>
        <span>→</span>
      </CtaBar>
    </div>
  );
}
