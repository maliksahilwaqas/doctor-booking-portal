"use client";

import { useEffect, useState, useTransition } from "react";
import { addLocation, removeLocation, saveLocationSchedule, toggleLocationActive, toggleOffDay } from "@/actions/doctor";
import { computeSessionPreview } from "@/lib/calc/scheduleEditor";
import { formatTime } from "@/lib/calc/format";
import { DOW_SHORT } from "@/lib/calc/schedule";
import { CtaBar } from "@/components/ui/primitives";
import type { SessionName } from "@/types/database.types";

export interface EditableLocation {
  id: string;
  name: string;
  area: string;
  session: SessionName;
  days: number[];
  fromMin: number;
  toMin: number;
  slotMin: number;
  active: boolean;
}

const COUNT_OPTIONS = [12, 18, 24, 30, 36];

export function SettingsTab({
  locations,
  allowedSlotMinutes,
  offDays,
}: {
  locations: EditableLocation[];
  allowedSlotMinutes: number[];
  offDays: number[];
}) {
  const [pending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = locations.find((l) => l.id === editingId) ?? null;

  async function onAdd() {
    setAdding(true);
    await addLocation();
    setAdding(false);
  }

  function onRemove(l: EditableLocation) {
    if (!window.confirm(`Remove ${l.name} — ${l.area}? This can't be undone.`)) return;
    startTransition(() => void removeLocation(l.id));
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-baseline justify-between">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.1em]">Your locations</div>
          <div className="text-[11.5px] text-muted">{locations.length} saved</div>
        </div>
        <div className="mt-2">
          {locations.length === 0 ? (
            <div className="border border-divider bg-surface p-4 text-sm text-muted">No locations yet.</div>
          ) : null}
          {locations.map((l) => (
            <div key={l.id} className="flex items-center gap-2 border-b border-divider py-2.5 last:border-b-0">
              <div className="flex-1" style={{ opacity: l.active ? 1 : 0.5 }}>
                <div className="text-sm font-extrabold">
                  {l.name} — {l.area}
                </div>
                <div className="text-[11.5px] text-muted">
                  {l.active ? "" : "Turned off · "}
                  {l.session} · {l.days.map((d) => DOW_SHORT[d - 1]).join(", ")} · {formatTime(l.fromMin)}–{formatTime(l.toMin)} · {l.slotMin} min
                </div>
              </div>
              <button
                disabled={pending}
                onClick={() => startTransition(() => void toggleLocationActive(l.id))}
                className="cursor-pointer px-2 py-1.5 text-[10.5px] font-extrabold whitespace-nowrap"
                style={{
                  border: `1px solid ${l.active ? "var(--accent)" : "var(--divider)"}`,
                  background: l.active ? "var(--accent)" : "var(--neutral-200)",
                  color: l.active ? "#fff" : "var(--muted)",
                }}
              >
                {l.active ? "ON" : "OFF"}
              </button>
              <button
                onClick={() => setEditingId(l.id)}
                className="cursor-pointer px-2 py-1.5 text-[10.5px] font-extrabold"
                style={{ border: "1px solid var(--accent-200)", background: "var(--accent-100)", color: "var(--accent-700)" }}
              >
                EDIT
              </button>
              <button
                disabled={pending}
                onClick={() => onRemove(l)}
                className="cursor-pointer px-2 py-1.5 text-[10.5px] font-extrabold"
                style={{ border: "1px solid var(--divider)" }}
              >
                REMOVE
              </button>
            </div>
          ))}
        </div>
        <CtaBar className="mt-3" disabled={adding} onClick={onAdd}>
          <span>{adding ? "ADDING…" : "+ ADD LOCATION"}</span>
          <span>→</span>
        </CtaBar>
      </div>

      <div className="border-t border-divider pt-3">
        <div className="text-[11px] font-extrabold uppercase tracking-[0.1em]">Off days</div>
        <div className="mt-2 grid grid-cols-7 gap-px border border-divider bg-divider">
          {DOW_SHORT.map((d, i) => {
            const n = i + 1;
            const on = offDays.includes(n);
            return (
              <button
                key={d}
                disabled={pending}
                onClick={() => startTransition(() => void toggleOffDay(n))}
                className="cursor-pointer py-2 text-center text-xs font-extrabold"
                style={{ background: on ? "var(--accent)" : "var(--accent-100)", color: on ? "#fff" : "var(--accent-700)" }}
              >
                {d}
              </button>
            );
          })}
        </div>
        <div className="mt-2 text-[11.5px] text-muted">
          {offDays.length
            ? `${offDays.map((d) => DOW_SHORT[d - 1]).join(", ")} off at every location. No tokens are generated and the day shows as closed to patients.`
            : "No off days set — every day generates tokens."}
        </div>
      </div>

      {editing ? (
        <LocationEditorModal key={editing.id} location={editing} allowedSlotMinutes={allowedSlotMinutes} onClose={() => setEditingId(null)} />
      ) : null}
    </div>
  );
}

function LocationEditorModal({
  location,
  allowedSlotMinutes,
  onClose,
}: {
  location: EditableLocation;
  allowedSlotMinutes: number[];
  onClose: () => void;
}) {
  const [session, setSession] = useState<"morning" | "evening" | "both">(location.session);
  const [fromMin, setFromMin] = useState(location.fromMin);
  const [toMin, setToMin] = useState(location.toMin);
  const [days, setDays] = useState<number[]>(location.days.slice());
  const [divide, setDivide] = useState<"slot" | "count">("slot");
  const [slot, setSlot] = useState(location.slotMin);
  const [count, setCount] = useState(24);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const preview = computeSessionPreview(fromMin, toMin, divide, slot, count);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function save() {
    setSaving(true);
    setError("");
    // "By patient count" only ever chooses a token count -- the schema has
    // no such column, so what actually gets persisted is the slot length
    // that produces that count. Snapping that to one of the admin's fixed
    // slot-length options collapsed almost every count down to the same
    // smallest allowed value for a normal-length session (e.g. 12-36
    // patients in a 60-minute session all round to 5 min), so a save
    // looked like it did nothing no matter what the doctor picked. Save
    // the number the count actually produces instead.
    const slotMin = divide === "slot" ? slot : Math.max(1, preview.effectiveSlotMin);
    try {
      const result = await saveLocationSchedule({
        locationId: location.id,
        session: session === "both" ? "morning" : session,
        fromMin,
        toMin,
        days,
        slotMin,
        divideByCount: divide === "count",
      });
      if (result.error) setError(result.error);
      else onClose();
    } catch {
      // A stale page open across a deploy is the most likely cause here --
      // the server action call itself can fail outright instead of
      // returning a normal error, which without this would leave the
      // button stuck on "Saving..." forever with no way to tell what
      // happened.
      setError("Couldn't reach the server. Refresh the page and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 sm:items-center sm:px-5" onClick={onClose}>
      <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto border-2 border-ink bg-bg p-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.1em]">
            Editing · {location.name}, {location.area}
          </div>
          <button onClick={onClose} className="cursor-pointer text-xl font-extrabold leading-none" aria-label="Close">
            ×
          </button>
        </div>

        <div className="mt-3">
          <div className="mb-1.5 text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted">Session</div>
          <div className="flex border border-divider">
            {(["morning", "evening", "both"] as const).map((o, i) => (
              <button
                key={o}
                onClick={() => setSession(o)}
                className="flex-1 cursor-pointer py-2 text-center text-[13px] font-extrabold capitalize"
                style={{
                  borderLeft: i === 0 ? "none" : "1px solid var(--divider)",
                  background: session === o ? "var(--accent)" : "var(--accent-100)",
                  color: session === o ? "#fff" : "var(--accent-700)",
                }}
              >
                {o}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3">
          <div className="mb-1.5 text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted">Sitting hours</div>
          <div className="grid grid-cols-2 gap-2">
            <Stepper label="From" value={fromMin} onDown={() => setFromMin((v) => Math.max(300, v - 30))} onUp={() => setFromMin((v) => Math.min(toMin - 30, v + 30))} />
            <Stepper label="To" value={toMin} onDown={() => setToMin((v) => Math.max(fromMin + 30, v - 30))} onUp={() => setToMin((v) => Math.min(1380, v + 30))} />
          </div>
          <div className="mt-1.5 text-[11.5px] text-muted">{(((toMin - fromMin) / 60).toFixed(1).replace(".0", ""))} hours of sitting time.</div>
        </div>

        <div className="mt-3">
          <div className="mb-1.5 text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted">Days</div>
          <div className="grid grid-cols-7 gap-px border border-divider bg-divider">
            {DOW_SHORT.map((d, i) => {
              const n = i + 1;
              const on = days.includes(n);
              return (
                <button
                  key={d}
                  onClick={() => setDays((cur) => (on ? cur.filter((x) => x !== n) : [...cur, n].sort((a, b) => a - b)))}
                  className="cursor-pointer py-2 text-center text-xs font-extrabold"
                  style={{ background: on ? "var(--accent)" : "var(--accent-100)", color: on ? "#fff" : "var(--accent-700)" }}
                >
                  {d.charAt(0)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-3.5 border-t border-divider pt-3">
          <div className="mb-1.5 text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted">How the session is divided</div>
          <div className="flex border border-divider">
            <button
              onClick={() => setDivide("slot")}
              className="flex-1 cursor-pointer py-2 text-center text-[13px] font-extrabold"
              style={{ background: divide === "slot" ? "var(--accent)" : "var(--accent-100)", color: divide === "slot" ? "#fff" : "var(--accent-700)" }}
            >
              By slot length
            </button>
            <button
              onClick={() => setDivide("count")}
              className="flex-1 cursor-pointer border-l border-divider py-2 text-center text-[13px] font-extrabold"
              style={{ background: divide === "count" ? "var(--accent)" : "var(--accent-100)", color: divide === "count" ? "#fff" : "var(--accent-700)" }}
            >
              By patient count
            </button>
          </div>
          <div className="flex border border-t-0 border-divider">
            {(divide === "slot" ? allowedSlotMinutes : COUNT_OPTIONS).map((v, i) => {
              const on = divide === "slot" ? slot === v : count === v;
              return (
                <button
                  key={v}
                  onClick={() => (divide === "slot" ? setSlot(v) : setCount(v))}
                  className="flex-1 cursor-pointer py-2 text-center text-[13px] font-extrabold"
                  style={{
                    borderLeft: i === 0 ? "none" : "1px solid var(--divider)",
                    background: on ? "var(--accent)" : "var(--accent-100)",
                    color: on ? "#fff" : "var(--accent-700)",
                  }}
                >
                  {v}
                </button>
              );
            })}
          </div>
          <div className="mt-2.5 bg-ink px-3 py-3 text-bg">
            <div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-accent-400">Result</div>
            <div className="mt-0.5 text-[19px] font-extrabold">
              {preview.tokenCount} tokens, numbered 1 to {preview.tokenCount}
            </div>
            <div className="mt-1 text-[12.5px] opacity-80">
              Token 1 at {formatTime(fromMin)}, token {preview.tokenCount} at {preview.lastTokenTime}. {preview.slotMinutesDisplay} min each. Patients book by token
              number in order.
            </div>
          </div>
        </div>

        {error ? <div className="mt-2 text-xs font-bold text-accent-700">{error}</div> : null}
        <CtaBar className="mt-3" disabled={saving} onClick={save}>
          <span>{saving ? "SAVING…" : `SAVE ${location.name.toUpperCase()}`}</span>
          <span>→</span>
        </CtaBar>
      </div>
    </div>
  );
}

function Stepper({ label, value, onDown, onUp }: { label: string; value: number; onDown: () => void; onUp: () => void }) {
  return (
    <div className="border border-divider bg-surface px-3 py-2.5">
      <div className="text-[10px] text-muted">{label}</div>
      <div className="flex items-center justify-between">
        <div className="text-base font-extrabold">{formatTime(value)}</div>
        <div className="flex gap-1">
          <button onClick={onDown} className="cursor-pointer px-1.5 font-extrabold">
            −
          </button>
          <button onClick={onUp} className="cursor-pointer px-1.5 font-extrabold">
            +
          </button>
        </div>
      </div>
    </div>
  );
}
