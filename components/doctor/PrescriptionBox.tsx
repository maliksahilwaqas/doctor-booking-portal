"use client";

import { useState } from "react";
import { savePrescription } from "@/actions/doctor";
import { CtaBar } from "@/components/ui/primitives";
import type { PrescriptionItem } from "@/types/database.types";

const BLANK_ROW: PrescriptionItem = { name: "", morning: false, night: false };
type FollowUpDays = 15 | 30 | 60 | null;
const FOLLOW_UP_OPTIONS: { label: string; value: FollowUpDays }[] = [
  { label: "No", value: null },
  { label: "15 days", value: 15 },
  { label: "30 days", value: 30 },
  { label: "60 days", value: 60 },
];

/**
 * Saves to the `prescriptions` table -- there's no "store" page to send it
 * to yet (see actions/doctor.ts's savePrescription and the admin Switches
 * tab, which is what turns this box on/off). When that portal is built it
 * just starts reading this same table; nothing here needs to change. The
 * follow-up choice feeds reception's Follow-ups list (lib/data/prescriptions.ts's
 * getUpcomingFollowUps), which reads whatever the latest prescription per
 * booking says.
 */
export function PrescriptionBox({
  bookingId,
  initialItems,
  initialNotes,
  initialFollowUpDays,
}: {
  bookingId: string;
  initialItems: PrescriptionItem[];
  initialNotes: string;
  initialFollowUpDays: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<PrescriptionItem[]>(initialItems.length ? initialItems : [{ ...BLANK_ROW }]);
  const [notes, setNotes] = useState(initialNotes);
  const [followUpDays, setFollowUpDays] = useState<FollowUpDays>(initialFollowUpDays as FollowUpDays);
  const [saved, setSaved] = useState(initialItems.length > 0 || initialNotes.length > 0 || initialFollowUpDays !== null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function updateRow(i: number, patch: Partial<PrescriptionItem>) {
    setRows((cur) => cur.map((r, j) => (j === i ? { ...r, ...patch } : r)));
    setSaved(false);
  }

  function addRow() {
    setRows((cur) => [...cur, { ...BLANK_ROW }]);
  }

  function removeRow(i: number) {
    setRows((cur) => cur.filter((_, j) => j !== i));
    setSaved(false);
  }

  const validRows = rows.filter((r) => r.name.trim().length > 0);
  const canSave = validRows.length > 0 || notes.trim().length > 0 || followUpDays !== null;

  async function save() {
    setSubmitting(true);
    setError("");
    const result = await savePrescription({ bookingId, items: validRows, notes: notes.trim(), followUpDays });
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSaved(true);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-3 w-full cursor-pointer border border-white/40 px-3 py-3 text-[13px] font-extrabold"
      >
        {saved ? "EDIT PRESCRIPTION" : "WRITE PRESCRIPTION"}
      </button>
    );
  }

  return (
    <div className="mt-2.5 border border-white/40 p-2.5">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border-b border-white/30 pb-1.5 text-left text-[10px] font-extrabold uppercase tracking-[0.08em] opacity-70">
              Medicine
            </th>
            <th className="border-b border-white/30 pb-1.5 text-left text-[10px] font-extrabold uppercase tracking-[0.08em] opacity-70">
              Dose
            </th>
            <th className="border-b border-white/30 pb-1.5" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td className="border-b border-white/15 py-1.5 pr-2">
                <input
                  value={row.name}
                  onChange={(e) => updateRow(i, { name: e.target.value })}
                  placeholder="Medicine name"
                  className="h-9 w-full border border-white/30 bg-transparent px-2 text-[13px] text-bg placeholder:text-bg/50 outline-none"
                />
              </td>
              <td className="border-b border-white/15 py-1.5">
                <div className="flex gap-3">
                  <label className="flex items-center gap-1.5 text-[11.5px] font-bold whitespace-nowrap">
                    <input type="checkbox" checked={row.morning} onChange={(e) => updateRow(i, { morning: e.target.checked })} />
                    Morning
                  </label>
                  <label className="flex items-center gap-1.5 text-[11.5px] font-bold whitespace-nowrap">
                    <input type="checkbox" checked={row.night} onChange={(e) => updateRow(i, { night: e.target.checked })} />
                    Night
                  </label>
                </div>
              </td>
              <td className="border-b border-white/15 py-1.5 pl-1 text-right">
                {rows.length > 1 ? (
                  <button onClick={() => removeRow(i)} className="cursor-pointer text-lg leading-none opacity-70" aria-label="Remove">
                    ×
                  </button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={addRow} className="mt-2 cursor-pointer text-[12px] font-extrabold underline">
        + Add medicine
      </button>

      <div className="mt-3">
        <div className="text-[10px] font-extrabold uppercase tracking-[0.08em] opacity-70">Note</div>
        <textarea
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            setSaved(false);
          }}
          placeholder="Dosage details, follow-up instructions…"
          rows={3}
          className="mt-1.5 w-full resize-y border border-white/30 bg-transparent p-2 text-[13px] text-bg placeholder:text-bg/50 outline-none"
        />
      </div>

      <div className="mt-3">
        <div className="text-[10px] font-extrabold uppercase tracking-[0.08em] opacity-70">Follow up</div>
        <div className="mt-1.5 flex gap-3">
          {FOLLOW_UP_OPTIONS.map((opt) => (
            <label key={opt.label} className="flex items-center gap-1.5 text-[11.5px] font-bold whitespace-nowrap">
              <input
                type="checkbox"
                checked={followUpDays === opt.value}
                onChange={() => {
                  setFollowUpDays(followUpDays === opt.value ? null : opt.value);
                  setSaved(false);
                }}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {error ? <div className="mt-1.5 text-xs font-bold text-accent-400">{error}</div> : null}
      <div className="mt-2.5 flex gap-2">
        <CtaBar className="flex-1" disabled={!canSave || submitting} onClick={save}>
          <span>{submitting ? "SAVING…" : saved ? "SAVED ✓" : "SAVE PRESCRIPTION"}</span>
        </CtaBar>
        <button onClick={() => setOpen(false)} className="cursor-pointer border border-white/40 px-3 text-[12px] font-extrabold">
          CLOSE
        </button>
      </div>
    </div>
  );
}
