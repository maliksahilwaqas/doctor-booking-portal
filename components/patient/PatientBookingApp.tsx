"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { requestAppointment } from "@/actions/booking";
import { tokenCount, tokenTime } from "@/lib/calc/tokens";
import { formatMoney, formatTime } from "@/lib/calc/format";
import { sessionLabel } from "@/lib/calc/labels";
import { buildDayList, dayKicker, dayLabel, findOpenDayIndex, isDayOpen, closedDayReason, todayISO, type DayInfo } from "@/lib/calc/schedule";
import { CtaBar, Kicker, RuleThick, SectionHeading, TextField } from "@/components/ui/primitives";
import type { CurrencyCode, SessionLabelStyle, SessionName } from "@/types/database.types";
import type { LocationVM } from "./types";

const SESSION_ORDER: SessionName[] = ["morning", "evening"];

/** `fromIndex` if it's open at `loc`, otherwise the next open day from there. */
function openDayIndexFor(loc: LocationVM | null, dayList: DayInfo[], offDays: number[], fromIndex: number): number {
  if (!loc) return fromIndex;
  const info = dayList[fromIndex];
  if (!info || isDayOpen(loc.days, offDays, info.weekday)) return fromIndex;
  return findOpenDayIndex(dayList, loc.days, offDays, fromIndex, 1);
}

export function PatientBookingApp({
  locations,
  currency,
  sessionLabels,
  offDays,
  bookingWindowDays,
  doctorName,
  speciality,
  quals,
  clinicPhone,
}: {
  locations: LocationVM[];
  currency: CurrencyCode;
  sessionLabels: SessionLabelStyle;
  offDays: number[];
  bookingWindowDays: number;
  doctorName: string;
  speciality: string;
  quals: string;
  clinicPhone: string;
}) {
  const sessions = useMemo(
    () => SESSION_ORDER.filter((s) => locations.some((l) => l.session === s)),
    [locations],
  );
  const [session, setSession] = useState<SessionName | null>(sessions[0] ?? null);
  const locsForSession = useMemo(() => locations.filter((l) => l.session === session), [locations, session]);
  const [locId, setLocId] = useState<string | null>(locsForSession[0]?.id ?? null);
  const loc = locations.find((l) => l.id === locId) ?? locsForSession[0] ?? locations[0] ?? null;

  const today = useMemo(() => todayISO(), []);
  const dayList = useMemo(() => buildDayList(today, bookingWindowDays), [today, bookingWindowDays]);
  // Today (index 0) can be closed at the default location -- start on the
  // next open day instead of letting the user pick a token the server will
  // reject for a closed day.
  const [dayIndex, setDayIndex] = useState(() => openDayIndexFor(loc, dayList, offDays, 0));
  const [dayNotice, setDayNotice] = useState("");

  const [token, setToken] = useState<number | null>(null);
  const [blink, setBlink] = useState(false);
  const blinkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [requesting, setRequesting] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [justRequested, setJustRequested] = useState(false);

  const [takenTokens, setTakenTokens] = useState<number[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const visitDate = dayList[dayIndex]?.iso ?? today;
  const selectionKey = `${loc?.id ?? ""}:${visitDate}`;

  useEffect(() => {
    if (!loc) return;
    let ignore = false;
    fetch(`/api/availability?locationId=${loc.id}&date=${visitDate}`)
      .then((r) => r.json())
      .then((data) => {
        if (ignore) return;
        setTakenTokens(data.taken ?? []);
        setLoadedKey(selectionKey);
      })
      .catch(() => {
        if (ignore) return;
        setTakenTokens([]);
        setLoadedKey(selectionKey);
      });
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc?.id, visitDate]);

  function resetSelection() {
    setToken(null);
    setBlink(false);
    setRequesting(false);
    setDayNotice("");
  }

  function chooseSession(name: SessionName) {
    const first = locations.find((l) => l.session === name);
    setSession(name);
    setLocId(first?.id ?? null);
    resetSelection();
    if (first) setDayIndex(openDayIndexFor(first, dayList, offDays, dayIndex));
  }

  function chooseLocation(id: string) {
    setLocId(id);
    resetSelection();
    const l = locations.find((x) => x.id === id);
    if (l) setDayIndex(openDayIndexFor(l, dayList, offDays, dayIndex));
  }

  function promptToken() {
    setToken(null);
    setBlink(true);
    if (blinkTimer.current) clearTimeout(blinkTimer.current);
    blinkTimer.current = setTimeout(() => setBlink(false), 5600);
  }

  function goToDay(index: number) {
    if (!loc) return;
    const info = dayList[index];
    if (isDayOpen(loc.days, offDays, info.weekday)) {
      setDayIndex(index);
      setToken(null);
      setBlink(false);
      setRequesting(false);
      setDayNotice("");
      return;
    }
    const next = findOpenDayIndex(dayList, loc.days, offDays, index, 1);
    setDayIndex(next);
    setToken(null);
    setBlink(false);
    setRequesting(false);
    setDayNotice(
      `${dayLabel(info)} ${closedDayReason(loc.name, offDays, info.weekday)}. Moved you to ${dayLabel(dayList[next])}, the next available day.`,
    );
  }

  function stepDay(dir: 1 | -1) {
    if (!loc) return;
    const next = findOpenDayIndex(dayList, loc.days, offDays, dayIndex, dir);
    setDayIndex(next);
    setToken(null);
    setBlink(false);
    setRequesting(false);
    setDayNotice("");
  }

  if (!loc) {
    return (
      <div className="border border-divider bg-surface p-5 text-sm text-muted">
        No locations configured yet. Add one from the Platform Admin&apos;s Locations tab.
      </div>
    );
  }

  const count = tokenCount(loc);
  const isTaken = (n: number) => takenTokens.includes(n);
  const freeNumbers: number[] = [];
  for (let n = 1; n <= count; n++) if (!isTaken(n)) freeNumbers.push(n);
  const nextFree = freeNumbers[0];
  const selectedToken = token && !isTaken(token) ? token : null;
  const loading = loadedKey !== selectionKey;

  async function submitRequest() {
    if (!loc || !selectedToken) return;
    setSubmitting(true);
    setFormError("");
    const result = await requestAppointment({
      locationId: loc.id,
      visitDate,
      tokenNumber: selectedToken,
      patientName,
      patientPhone,
    });
    setSubmitting(false);
    if (result.error) {
      setFormError(result.error);
      return;
    }
    setRequesting(false);
    setToken(null);
    setPatientName("");
    setPatientPhone("");
    setJustRequested(true);
    fetch(`/api/availability?locationId=${loc.id}&date=${visitDate}`)
      .then((r) => r.json())
      .then((data) => setTakenTokens(data.taken ?? []));
  }

  const hasDetails = patientName.trim().length > 1 && patientPhone.trim().length >= 7;

  return (
    <div className="flex flex-col gap-7">
      <div>
        <Kicker>
          {speciality} · {quals}
        </Kicker>
        <h1 className="mt-1 text-[26px] font-extrabold">{doctorName}</h1>
      </div>

      {sessions.length > 0 ? (
        <div>
          <div className="flex border-t-2 border-divider">
            {sessions.map((s, i) => {
              const active = s === session;
              const count = locations.filter((l) => l.session === s).length;
              return (
                <button
                  key={s}
                  onClick={() => chooseSession(s)}
                  className="flex-1 cursor-pointer px-3.5 py-3 text-left"
                  style={{ borderLeft: i === 0 ? "none" : "1px solid var(--divider)", borderBottom: active ? "3px solid var(--accent)" : "3px solid transparent" }}
                >
                  <div className="text-sm" style={{ fontWeight: active ? 800 : 600 }}>
                    {sessionLabel(sessionLabels, s)}
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted">
                    {count} location{count === 1 ? "" : "s"}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
            {locsForSession.map((l) => {
              const on = l.id === loc.id;
              return (
                <button
                  key={l.id}
                  onClick={() => chooseLocation(l.id)}
                  className="cursor-pointer px-3 py-2.5 text-left"
                  style={{
                    background: on ? "var(--accent)" : "transparent",
                    color: on ? "#fff" : "var(--ink)",
                    border: on ? "2px solid var(--accent)" : "1px solid var(--divider)",
                  }}
                >
                  <div className="text-[15px] font-extrabold">{l.name}</div>
                  <div className="mt-0.5 text-[11.5px] opacity-70">
                    {l.area} · {formatTime(l.fromMin)}–{formatTime(l.toMin)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div>
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted">Consultation fee</div>
            <div className="mt-0.5 text-[28px] font-extrabold leading-tight">{formatMoney(loc.fee, currency)}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted">Follow-up</div>
            <div className="text-lg font-extrabold">{formatMoney(loc.followUpFee, currency)}</div>
          </div>
        </div>
        <button
          onClick={() => {
            if (!selectedToken) promptToken();
            else document.getElementById("token-grid")?.scrollIntoView({ behavior: "smooth", block: "center" });
          }}
          className="mt-3 flex cursor-pointer items-center gap-1.5 text-[12.5px] font-extrabold uppercase tracking-[0.04em] text-accent-700"
        >
          <span>Choose token and confirm appointment</span>
          <span>→</span>
        </button>
      </div>

      <div>
        <div className="flex items-stretch border border-divider">
          <button onClick={() => stepDay(-1)} className="w-9 cursor-pointer border-r border-divider text-base" aria-label="Previous day">
            ‹
          </button>
          <div className="flex-1 px-3 py-2">
            <div className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-accent">{dayKicker(dayIndex)}</div>
            <div className="text-[15px] font-extrabold">{dayLabel(dayList[dayIndex])}</div>
          </div>
          <button onClick={() => stepDay(1)} className="w-9 cursor-pointer border-l border-divider text-base" aria-label="Next day">
            ›
          </button>
        </div>
        <div className="mt-2.5 flex gap-2 overflow-x-auto pb-1">
          {dayList.map((d, i) => {
            const active = i === dayIndex;
            const open = isDayOpen(loc.days, offDays, d.weekday);
            return (
              <button
                key={d.iso}
                onClick={() => goToDay(i)}
                className="flex-none cursor-pointer px-0 py-1.5 text-center"
                style={{
                  width: 50,
                  background: active ? "var(--ink)" : "transparent",
                  color: active ? "var(--bg)" : "var(--ink)",
                  border: `1px solid ${active ? "var(--ink)" : "var(--divider)"}`,
                  opacity: open ? 1 : 0.35,
                }}
              >
                <div className="text-[9.5px] tracking-[0.08em]">{d.dow}</div>
                <div className="text-[15px] font-extrabold">{d.day}</div>
                <div className="h-[11px] text-[9px] uppercase tracking-[0.06em]">{d.day === 1 || i === 0 ? d.month : ""}</div>
              </button>
            );
          })}
        </div>
        {dayNotice ? (
          <div className="mt-2 flex gap-2 border-l-[3px] border-accent bg-accent-100 px-2.5 py-2">
            <div className="text-xs font-bold text-accent-700">{dayNotice}</div>
          </div>
        ) : null}
      </div>

      <div id="token-grid">
        <div className="flex items-baseline justify-between">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.1em]">
            Tokens · {formatTime(loc.fromMin)}–{formatTime(loc.toMin)}
          </div>
          <div className="text-[11.5px] text-muted">
            {loading ? "Loading…" : `${loc.slotMin} min each · ${count} tokens · ${freeNumbers.length} open`}
          </div>
        </div>
        <div className="mt-2.5 grid grid-cols-3 gap-2">
          {Array.from({ length: count }, (_, i) => i + 1).map((n) => {
            const taken = isTaken(n);
            const isSel = n === selectedToken;
            const showBlink = blink && !selectedToken && n === nextFree;
            let bg = "#faf9f9";
            let fg = "var(--ink)";
            let border = "var(--accent-200)";
            if (taken) {
              bg = "var(--neutral-300)";
              fg = "rgba(32,30,29,.45)";
              border = "var(--neutral-400)";
            }
            if (isSel) {
              bg = "var(--accent)";
              fg = "#fff";
              border = "var(--accent)";
            }
            return (
              <button
                key={n}
                disabled={taken}
                onClick={() => {
                  setToken(n);
                  setBlink(false);
                  setRequesting(false);
                }}
                className="px-2.5 py-2"
                style={{
                  minHeight: 48,
                  cursor: taken ? "not-allowed" : "pointer",
                  background: bg,
                  color: fg,
                  border: `1px solid ${border}`,
                  animation: showBlink ? "token-blink .7s steps(1,end) 8" : "none",
                  textAlign: "left",
                }}
              >
                <div className="text-lg font-extrabold leading-tight tracking-[-0.01em]" style={{ textDecoration: taken ? "line-through" : "none" }}>
                  T{n}
                </div>
                <div className="text-[11px] opacity-70">{isSel ? `${tokenTime(loc, n)} · yours` : taken ? "Booked" : tokenTime(loc, n)}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative">
        {requesting && selectedToken ? (
          <div className="absolute inset-x-0 top-0 z-10 -mt-2">
            <div className="border-2 border-ink bg-bg p-4" style={{ boxShadow: "var(--shadow-lg)" }}>
              <div className="flex items-start justify-between gap-2.5">
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-accent">Appointment details</div>
                  <div className="mt-0.5 text-xl font-extrabold leading-tight">
                    Token {selectedToken} · {tokenTime(loc, selectedToken)}
                  </div>
                </div>
                <button onClick={() => setRequesting(false)} className="cursor-pointer text-xl font-extrabold leading-none" aria-label="Close">
                  ×
                </button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-px border border-divider bg-divider">
                <div className="bg-bg px-2.5 py-2">
                  <div className="text-[9.5px] font-extrabold uppercase tracking-[0.1em] text-muted">APPOINTMENT</div>
                  <div className="text-sm font-extrabold">{dayLabel(dayList[dayIndex])} · {tokenTime(loc, selectedToken)}</div>
                </div>
                <div className="bg-bg px-2.5 py-2">
                  <div className="text-[9.5px] font-extrabold uppercase tracking-[0.1em] text-muted">TOKEN</div>
                  <div className="text-sm font-extrabold">Token {selectedToken} of {count}</div>
                </div>
                <div className="bg-bg px-2.5 py-2">
                  <div className="text-[9.5px] font-extrabold uppercase tracking-[0.1em] text-muted">LOCATION</div>
                  <div className="text-sm font-extrabold">{loc.name}, {loc.area}</div>
                </div>
                <div className="bg-bg px-2.5 py-2">
                  <div className="text-[9.5px] font-extrabold uppercase tracking-[0.1em] text-muted">TOTAL FEE</div>
                  <div className="text-sm font-extrabold">{formatMoney(loc.fee, currency)}</div>
                </div>
              </div>

              <div className="mt-3 flex flex-col gap-2">
                <TextField label="Patient name" placeholder="Full name" value={patientName} onChange={(e) => setPatientName(e.target.value)} />
                <TextField label="Mobile number" placeholder="03xx xxxxxxx" value={patientPhone} onChange={(e) => setPatientPhone(e.target.value)} />
              </div>

              {formError ? <div className="mt-2 text-xs font-bold text-accent-700">{formError}</div> : null}

              <CtaBar className="mt-3" disabled={!hasDetails || submitting} onClick={submitRequest}>
                <span>{submitting ? "SENDING…" : "CONFIRM APPOINTMENT"}</span>
                <span>→</span>
              </CtaBar>
              <div className="mt-2 text-[11.5px] text-muted">
                {hasDetails ? `Reception confirms within 15 minutes. ${formatMoney(loc.fee, currency)} paid at the counter.` : "Reception calls this number to confirm the token."}
              </div>
            </div>
          </div>
        ) : null}

        <div className="border-2 border-ink p-3">
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex-1">
              <div className="text-[19px] font-extrabold leading-tight">
                {selectedToken ? `Token ${selectedToken} · ${tokenTime(loc, selectedToken)}` : "No token selected"}
              </div>
              <div className="mt-1 text-[12.5px] text-muted">
                {selectedToken
                  ? `${loc.name}, ${loc.area} · ${dayLabel(dayList[dayIndex])}`
                  : blink && nextFree
                    ? `Token ${nextFree} at ${tokenTime(loc, nextFree)} is the first one free — it is flashing in the grid above.`
                    : `Tap a token above. Tokens run in order from ${tokenTime(loc, 1)}.`}
              </div>
            </div>
            <div className="flex-none text-right">
              <div className="text-[9.5px] font-extrabold uppercase tracking-[0.1em] text-muted">Appointment fee</div>
              <div className="text-[19px] font-extrabold leading-tight">{selectedToken ? formatMoney(loc.fee, currency) : "—"}</div>
            </div>
          </div>
          <CtaBar
            className="mt-3"
            onClick={() => (selectedToken ? setRequesting(true) : promptToken())}
            style={{
              background: selectedToken ? "var(--accent)" : "var(--neutral-300)",
              color: selectedToken ? "#fff" : "rgba(32,30,29,.55)",
              cursor: "pointer",
            }}
          >
            <span>{selectedToken ? "REQUEST APPOINTMENT" : "PICK A TOKEN FIRST"}</span>
            <span>→</span>
          </CtaBar>
        </div>
      </div>

      {justRequested ? (
        <div className="border border-ink bg-ink px-4 py-3 text-sm font-bold text-bg">
          Request sent — reception will confirm shortly.
          <button className="ml-3 cursor-pointer underline" onClick={() => setJustRequested(false)}>
            Dismiss
          </button>
        </div>
      ) : null}

      <RuleThick />

      <div>
        <SectionHeading>Location details</SectionHeading>
        <div className="flex flex-col gap-2.5">
          {locations.map((l) => (
            <button key={l.id} onClick={() => chooseLocation(l.id)} className="flex cursor-pointer gap-2.5 text-left">
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className="text-sm font-extrabold">
                    {l.name} — {l.area}
                  </span>
                  <span className="text-[13px] font-extrabold text-accent-700">{formatMoney(l.fee, currency)}</span>
                </div>
                <div className="text-xs text-muted">{l.detail}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <SectionHeading>About the doctor</SectionHeading>
        <div className="flex gap-3">
          <div className="h-[100px] w-[84px] flex-none bg-neutral-200 p-1.5 text-[9px] text-muted">Doctor photo</div>
          <div className="flex-1">
            <div className="text-base font-extrabold">{doctorName}</div>
            <div className="text-xs font-bold text-accent-700">{speciality}</div>
            <div className="mt-1 text-xs text-muted">{quals}</div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-2 border-ink px-3.5 py-3">
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted">Call reception</div>
          <div className="text-[19px] font-extrabold leading-tight">{clinicPhone}</div>
        </div>
        <a href={`tel:${clinicPhone.replace(/\s+/g, "")}`} className="bg-accent px-3.5 py-2.5 text-[13px] font-extrabold text-white">
          CALL
        </a>
      </div>
    </div>
  );
}
