import { formatMoney } from "@/lib/calc/format";
import type { CurrencyCode } from "@/types/database.types";

export interface LocationEarningsVM {
  id: string;
  name: string;
  area: string;
  /** Only set when two sittings at the same place would otherwise read identically. */
  session: string | null;
  total: number;
  patientCount: number;
}

export function EarningsTab({
  monthLabel,
  byLocation,
  currency,
}: {
  monthLabel: string;
  byLocation: LocationEarningsVM[];
  currency: CurrencyCode;
}) {
  const total = byLocation.reduce((sum, l) => sum + l.total, 0);
  const patients = byLocation.reduce((sum, l) => sum + l.patientCount, 0);
  const max = Math.max(1, ...byLocation.map((l) => l.total));

  return (
    <div>
      <div className="text-[11px] font-extrabold uppercase tracking-[0.1em]">{monthLabel}</div>

      <div className="mt-2.5 border-2 border-ink px-3.5 py-3">
        <div className="text-[9.5px] font-extrabold uppercase tracking-[0.1em] text-muted">Total patients checked</div>
        <div className="mt-0.5 text-[36px] font-extrabold leading-tight">{patients}</div>
      </div>

      <div className="mt-4 text-[11px] font-extrabold uppercase tracking-[0.1em]">By location</div>
      <div className="mt-2 flex flex-col gap-2.5">
        {byLocation.length === 0 ? <div className="text-sm text-muted">No checked-in patients this month yet.</div> : null}
        {byLocation.map((l) => (
          <div key={l.id}>
            <div className="flex justify-between text-[13px]">
              <span className="font-extrabold">
                {l.name} — {l.area}
                {l.session ? ` · ${l.session}` : ""}
              </span>
              <span className="font-extrabold">{formatMoney(l.total, currency)}</span>
            </div>
            <div className="mt-1 h-3 bg-neutral-200">
              <span className="block h-3 bg-accent" style={{ width: `${(l.total / max) * 100}%` }} />
            </div>
            <div className="mt-0.5 text-[11.5px] text-muted">{l.patientCount} patients</div>
          </div>
        ))}
      </div>

      <div className="mt-4 bg-ink px-3.5 py-3 text-bg">
        <div className="text-[9.5px] font-extrabold uppercase tracking-[0.1em] text-accent-400">Total collection</div>
        <div className="mt-0.5 text-[28px] font-extrabold leading-tight">{formatMoney(total, currency)}</div>
      </div>
    </div>
  );
}
