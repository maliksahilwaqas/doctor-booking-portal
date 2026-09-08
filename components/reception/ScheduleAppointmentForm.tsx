"use client";

import { useEffect, useState } from "react";
import { scheduleAppointment } from "@/actions/reception";
import { tokenCount, tokenTime } from "@/lib/calc/tokens";
import { CtaBar, TextField } from "@/components/ui/primitives";
import type { LocationVM } from "@/components/patient/types";

export function ScheduleAppointmentForm({ locations, today }: { locations: LocationVM[]; today: string }) {
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");
  const [visitDate, setVisitDate] = useState(today);
  const [token, setToken] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [scheduled, setScheduled] = useState(false);

  const loc = locations.find((l) => l.id === locationId) ?? null;

  const [takenTokens, setTakenTokens] = useState<number[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const key = `${locationId}:${visitDate}`;

  useEffect(() => {
    if (!locationId || !visitDate) return;
    let ignore = false;
    fetch(`/api/availability?locationId=${locationId}&date=${visitDate}`)
      .then((r) => r.json())
      .then((data) => {
        if (ignore) return;
        setTakenTokens(data.taken ?? []);
        setLoadedKey(key);
      })
      .catch(() => {
        if (ignore) return;
        setTakenTokens([]);
        setLoadedKey(key);
      });
    return () => {
      ignore = true;
    };
  }, [locationId, visitDate, key]);

  const count = loc ? tokenCount(loc) : 0;
  const loading = loadedKey !== key;
  const takenSet = new Set(takenTokens);
  const freeNumbers: number[] = [];
  for (let n = 1; n <= count; n++) if (!takenSet.has(n)) freeNumbers.push(n);

  function changeLocation(id: string) {
    setLocationId(id);
    setToken(null);
    setScheduled(false);
  }

  function changeDate(date: string) {
    setVisitDate(date);
    setToken(null);
    setScheduled(false);
  }

  async function submit() {
    if (!loc || !token) return;
    setSubmitting(true);
    setError("");
    const result = await scheduleAppointment({
      locationId: loc.id,
      visitDate,
      tokenNumber: token,
      patientName: name,
      patientPhone: phone,
    });
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setToken(null);
    setName("");
    setPhone("");
    setScheduled(true);
    fetch(`/api/availability?locationId=${loc.id}&date=${visitDate}`)
      .then((r) => r.json())
      .then((data) => setTakenTokens(data.taken ?? []));
  }

  const hasDetails = name.trim().length > 1 && phone.trim().length >= 7;

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <div className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted">Location</div>
          <select
            value={locationId}
            onChange={(e) => changeLocation(e.target.value)}
            className="h-[42px] w-full border border-divider bg-surface px-2 text-sm font-medium"
          >
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} — {l.area}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <div className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted">Date</div>
          <input
            type="date"
            value={visitDate}
            min={today}
            onChange={(e) => changeDate(e.target.value)}
            className="h-[42px] w-full border border-divider bg-surface px-2 text-sm font-medium"
          />
        </label>
      </div>

      {loc ? (
        <div className="mt-3">
          <div className="flex items-baseline justify-between">
            <div className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted">Token</div>
            <div className="text-[11px] text-muted">{loading ? "Loading…" : `${freeNumbers.length} of ${count} open`}</div>
          </div>
          <div className="mt-1.5 grid grid-cols-4 gap-1.5">
            {Array.from({ length: count }, (_, i) => i + 1).map((n) => {
              const taken = takenTokens.includes(n);
              const on = n === token;
              return (
                <button
                  key={n}
                  disabled={taken}
                  onClick={() => setToken(n)}
                  className="px-1.5 py-1.5 text-left"
                  style={{
                    cursor: taken ? "not-allowed" : "pointer",
                    background: on ? "var(--accent)" : taken ? "var(--neutral-300)" : "transparent",
                    color: on ? "#fff" : taken ? "rgba(32,30,29,.45)" : "var(--ink)",
                    border: `1px solid ${on ? "var(--accent)" : taken ? "var(--neutral-400)" : "var(--accent-200)"}`,
                  }}
                >
                  <div className="text-[13px] font-extrabold" style={{ textDecoration: taken ? "line-through" : "none" }}>
                    T{n}
                  </div>
                  <div className="text-[10px] opacity-75">{taken ? "Booked" : tokenTime(loc, n)}</div>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <TextField label="Mobile" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>

      {error ? <div className="mt-1.5 text-xs font-bold text-accent-700">{error}</div> : null}
      <CtaBar className="mt-2.5" disabled={!token || !hasDetails || submitting} onClick={submit}>
        <span>{submitting ? "SCHEDULING…" : token ? `SCHEDULE · TOKEN ${token}` : "PICK A TOKEN"}</span>
      </CtaBar>
      {scheduled ? <div className="mt-1.5 text-[11.5px] font-bold text-accent-700">Appointment scheduled.</div> : null}
    </div>
  );
}
