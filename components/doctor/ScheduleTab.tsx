import Link from "next/link";
import { formatTime } from "@/lib/calc/format";

export interface TodaySessionVM {
  locationId: string;
  name: string;
  area: string;
  sessionLabel: string;
  fromMin: number;
  toMin: number;
  booked: number;
  capacity: number;
}

export interface WeekDayVM {
  dow: string;
  day: number;
  openSummary: string;
  booked: number;
}

export function ScheduleTab({
  todayLabel,
  sessions,
  week,
  offDayNames,
  settingsHref,
}: {
  todayLabel: string;
  sessions: TodaySessionVM[];
  week: WeekDayVM[];
  offDayNames: string[];
  settingsHref: string;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-baseline justify-between">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.1em]">Today · {todayLabel}</div>
          <div className="text-[11.5px] text-muted">{sessions.length} session{sessions.length === 1 ? "" : "s"}</div>
        </div>

        {sessions.length === 0 ? (
          <div className="mt-2.5 border border-divider bg-surface p-4 text-sm text-muted">No sessions today.</div>
        ) : null}

        {sessions.map((s, i) => (
          <div key={s.locationId} className={i === 0 ? "mt-2.5 border-2 border-ink" : "mt-2.5 border border-divider"}>
            <div
              className="flex items-center justify-between px-3 py-2.5"
              style={i === 0 ? { background: "var(--ink)", color: "var(--bg)" } : undefined}
            >
              <span className="text-sm font-extrabold">
                {s.sessionLabel} · {s.name}, {s.area}
              </span>
              <span className="text-[11px] tracking-[0.08em]" style={i === 0 ? undefined : { color: "var(--muted)" }}>
                {formatTime(s.fromMin)}–{formatTime(s.toMin)}
              </span>
            </div>
            <div className="flex items-end justify-between px-3 py-2.5">
              <div>
                <div className="text-[9.5px] font-extrabold uppercase tracking-[0.1em] text-muted">Patients booked</div>
                <div className="text-[28px] font-extrabold leading-tight">{s.booked}</div>
              </div>
              <div className="text-right text-[11.5px] text-muted">of {s.capacity} tokens</div>
            </div>
            {i === 0 ? (
              <div className="px-3 pb-3">
                <div className="h-3 bg-neutral-200">
                  <span
                    className="block h-3 bg-accent"
                    style={{ width: `${s.capacity ? Math.min(100, (s.booked / s.capacity) * 100) : 0}%` }}
                  />
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div>
        <div className="text-[11px] font-extrabold uppercase tracking-[0.1em]">This week</div>
        <div className="mt-2">
          {week.map((d) => (
            <div key={`${d.dow}-${d.day}`} className="flex items-center gap-3 border-b border-divider py-2.5 last:border-b-0">
              <div className="w-14 text-[13px] font-extrabold">
                {d.dow} {d.day}
              </div>
              <div className="flex-1 text-[12.5px]">{d.openSummary}</div>
              <div className="text-sm font-extrabold">{d.booked || "—"}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-ink px-3.5 py-3.5 text-bg">
        <div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-accent-400">Weekly off days</div>
        <div className="mt-1 text-[19px] font-extrabold">
          {offDayNames.length ? offDayNames.join(", ") : "None set"}
        </div>
        <div className="mt-1.5 text-[12.5px] opacity-80">
          {offDayNames.length
            ? "No tokens are generated on these weekdays at any location."
            : "Every weekday your locations are open generates tokens."}
        </div>
        <div className="mt-3 flex gap-2">
          <Link href={settingsHref} className="border border-white/40 px-3 py-2.5 text-[13px] font-extrabold">
            OPEN SETTINGS
          </Link>
        </div>
      </div>
    </div>
  );
}
