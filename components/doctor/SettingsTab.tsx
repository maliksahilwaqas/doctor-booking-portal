"use client";

import { useState, useTransition } from "react";
import { saveLocationSchedule, toggleLocationActive, toggleOffDay } from "@/actions/doctor";
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
  const [selectedId, setSelectedId] = useState(locations[0]?.id ?? "");
  const selected = locations.find((l) => l.id === selectedId) ?? locations[0] ?? null;

  const [session, setSession] = useState<"morning" | "evening" | "both">(selected?.session ?? "morning");
  const [fromMin, setFromMin] = useState(selected?.fromMin ?? 540);
  const [toMin, setToMin] = useState(selected?.toMin ?? 720);
  const [days, setDays] = useState<number[]>(selected?.days ?? []);
  const [divide, setDivide] = useState<"slot" | "count">("slot");
  const [slot, setSlot] = useState(selected?.slotMin ?? allowedSlotMinutes[0] ?? 15);
  const [count, setCount] = useState(24);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  function selectLocation(loc: EditableLocation) {
    setSelectedId(loc.id);
    setSession(loc.session);
    setFromMin(loc.fromMin);
    setToMin(loc.toMin);
    setDays(loc.days.slice());
    setDivide("slot");
    setSlot(loc.slotMin);
    setSaved(false);
    setError("");
  }

  const preview = computeSessionPreview(fromMin, toMin, divide, slot, count);

  async function save() {
    if (!selected) return;
    setError("");
    setSaved(false);
    const result = await saveLocationSchedule({
      locationId: selected.id,
      session: session === "both" ? "morning" : session,
      fromMin,
      toMin,
      days,
      slotMin: divide === "slot" ? slot : selected.slotMin,
    });
    if (result.error) setError(result.error);
    else setSaved(true);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-baseline justify-between">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.1em]">Your locations</div>
          <div className="text-[11.5px] text-muted">{locations.length} saved</div>
        </div>
        <div className="mt-2">
          {locations.map((l) => (
            <div key={l.id} className="flex items-center gap-3 border-b border-divider py-2.5 last:border-b-0">
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
                className="cursor-pointer px-2.5 py-1.5 text-[11.5px] font-extrabold"
                style={{
                  border: `1px solid ${l.active ? "var(--accent)" : "var(--divider)"}`,
                  background: l.active ? "var(--accent)" : "var(--neutral-200)",
                  color: l.active ? "#fff" : "var(--muted)",
                }}
              >
                {l.active ? "ON" : "OFF"}
              </button>
              <button
                onClick={() => selectLocation(l)}
                className="cursor-pointer px-2.5 py-1.5 text-xs font-extrabold"
                style={{
                  border: `1px solid ${l.id === selectedId ? "var(--accent)" : "var(--accent-200)"}`,
                  background: l.id === selectedId ? "var(--accent)" : "var(--accent-100)",
                  color: l.id === selectedId ? "#fff" : "var(--accent-700)",
                }}
              >
                {l.id === selectedId ? "EDITING" : "EDIT"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {selected ? (
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-[0.1em]">
            Editing · {selected.name}, {selected.area}
          </div>

          <div className="mt-2.5">
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
                Token 1 at {formatTime(fromMin)}, token {preview.tokenCount} at {preview.lastTokenTime}. {preview.slotMinutesDisplay} min each.
                Patients book by token number in order.
              </div>
            </div>
          </div>

          {error ? <div className="mt-2 text-xs font-bold text-accent-700">{error}</div> : null}
          <CtaBar className="mt-3" onClick={save}>
            <span>SAVE {selected.name.toUpperCase()}</span>
            <span>→</span>
          </CtaBar>
          {saved ? <div className="mt-1.5 text-[11.5px] font-bold text-accent-700">Saved.</div> : null}
        </div>
      ) : null}

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
