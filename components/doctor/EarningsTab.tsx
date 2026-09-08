import { formatMoney } from "@/lib/calc/format";
import type { CurrencyCode } from "@/types/database.types";

export interface LocationEarningsVM {
  name: string;
  area: string;
  total: number;
  patientCount: number;
}

export function EarningsTab({
  monthLabel,
  byLocation,
  unpaid,
  currency,
}: {
  monthLabel: string;
  byLocation: LocationEarningsVM[];
  unpaid: number;
  currency: CurrencyCode;
}) {
  const total = byLocation.reduce((sum, l) => sum + l.total, 0);
  const patients = byLocation.reduce((sum, l) => sum + l.patientCount, 0);
  const max = Math.max(1, ...byLocation.map((l) => l.total));

  return (
    <div>
      <div className="text-[11px] font-extrabold uppercase tracking-[0.1em]">{monthLabel}</div>
      <div className="mt-1.5 text-[36px] font-extrabold leading-tight">{formatMoney(total, currency)}</div>
      <div className="mt-0.5 text-[12.5px] font-bold text-accent-700">{patients} patients</div>

      <div className="mt-4 text-[11px] font-extrabold uppercase tracking-[0.1em]">By location</div>
      <div className="mt-2 flex flex-col gap-2.5">
        {byLocation.length === 0 ? <div className="text-sm text-muted">No confirmed bookings this month yet.</div> : null}
        {byLocation.map((l) => (
          <div key={l.name}>
            <div className="flex justify-between text-[13px]">
              <span className="font-extrabold">
                {l.name} — {l.area}
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

      <div className="mt-4 grid grid-cols-2 gap-px border border-divider bg-divider">
        <div className="bg-bg px-3 py-2.5">
          <div className="text-[9.5px] font-extrabold uppercase tracking-[0.1em] text-muted">Avg per patient</div>
          <div className="text-[22px] font-extrabold">{patients ? formatMoney(Math.round(total / patients), currency) : "—"}</div>
        </div>
        <div className="bg-bg px-3 py-2.5">
          <div className="text-[9.5px] font-extrabold uppercase tracking-[0.1em] text-muted">Unpaid</div>
          <div className="text-[22px] font-extrabold text-accent-700">{formatMoney(unpaid, currency)}</div>
        </div>
      </div>
    </div>
  );
}
