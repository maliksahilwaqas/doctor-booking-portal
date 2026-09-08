"use client";

import { useTransition } from "react";
import { cycleWordingVar, setAccent } from "@/actions/admin";
import { ACCENT_NAMES, ACCENT_THEMES, type AccentName } from "@/lib/calc/accents";
import type { CurrencyCode, LocationTerm, SessionLabelStyle } from "@/types/database.types";

const LABEL_DISPLAY: Record<SessionLabelStyle, string> = {
  morning_evening: "Morning / Evening",
  am_pm: "AM / PM",
  numbered: "Session 1 / 2",
};
const TERM_DISPLAY: Record<LocationTerm, string> = { hospital: "Hospital", clinic: "Clinic", branch: "Branch" };

const WORDING_ROWS: {
  key: "labels" | "term" | "currency" | "window" | "overbook";
  label: string;
  display: (v: unknown) => string;
  note: string;
}[] = [
  { key: "labels", label: "Session labels", display: (v) => LABEL_DISPLAY[v as SessionLabelStyle], note: "what patients see" },
  { key: "term", label: "Location term", display: (v) => TERM_DISPLAY[v as LocationTerm], note: "hospital · clinic · branch" },
  { key: "currency", label: "Currency", display: (v) => v as CurrencyCode, note: "symbol before amount" },
  { key: "window", label: "Booking window", display: (v) => `${v} days`, note: "how far ahead patients book" },
  { key: "overbook", label: "Overbook / session", display: (v) => `${v} tokens`, note: "needs doctor approval" },
];

export function BrandingTab({
  accent,
  sessionLabels,
  locationTerm,
  currency,
  bookingWindowDays,
  overbookPerSession,
}: {
  accent: AccentName;
  sessionLabels: SessionLabelStyle;
  locationTerm: LocationTerm;
  currency: CurrencyCode;
  bookingWindowDays: number;
  overbookPerSession: number;
}) {
  const [pending, startTransition] = useTransition();
  const values: Record<string, unknown> = {
    labels: sessionLabels,
    term: locationTerm,
    currency,
    window: bookingWindowDays,
    overbook: overbookPerSession,
  };
  const notes = Object.fromEntries(WORDING_ROWS.map((r) => [r.key, r.note]));

  return (
    <div>
      <div className="text-[11px] font-extrabold uppercase tracking-[0.1em]">Accent colour</div>
      <div className="mt-2.5 flex gap-2">
        {ACCENT_NAMES.map((name) => (
          <button
            key={name}
            disabled={pending}
            onClick={() => startTransition(() => void setAccent(name))}
            className="flex-1 cursor-pointer p-1"
            style={{ border: name === accent ? "2px solid var(--ink)" : "1px solid var(--divider)" }}
          >
            <div className="h-11" style={{ background: ACCENT_THEMES[name].accent }} />
            <div className="mt-1 text-center text-[9.5px] font-extrabold uppercase tracking-[0.06em]">{ACCENT_THEMES[name].label}</div>
          </button>
        ))}
      </div>
      <div className="mt-2 text-[11.5px] text-muted">
        {ACCENT_THEMES[accent].label} is live. Every screen — patient, reception and doctor — repaints on the new accent.
      </div>

      <div className="mt-5 text-[11px] font-extrabold uppercase tracking-[0.1em]">Wording</div>
      <div className="mt-2 grid grid-cols-2 gap-px border border-divider bg-divider">
        {WORDING_ROWS.map((row, i) => (
          <button
            key={row.key}
            disabled={pending}
            onClick={() => startTransition(() => void cycleWordingVar(row.key))}
            className={`cursor-pointer bg-bg px-3 py-2.5 text-left ${
              i === WORDING_ROWS.length - 1 && WORDING_ROWS.length % 2 === 1 ? "col-span-2" : ""
            }`}
          >
            <div className="text-[9.5px] font-extrabold uppercase tracking-[0.1em] text-muted">{row.label}</div>
            <div className="text-[15px] font-extrabold">{row.display(values[row.key])}</div>
            <div className="text-[11px] text-muted">{notes[row.key]}</div>
          </button>
        ))}
      </div>
      <div className="mt-2 text-[11px] text-muted">
        Session labels, location term, currency and booking window take effect on the patient booking page. Overbook is
        stored for reference — it is not yet enforced.
      </div>
    </div>
  );
}
