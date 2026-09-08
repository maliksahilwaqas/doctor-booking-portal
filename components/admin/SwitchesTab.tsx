"use client";

import { useTransition } from "react";
import { setAllowedSlotMinutes, toggleFeatureFlag } from "@/actions/admin";
import { SLOT_MINUTE_OPTIONS } from "@/lib/calc/adminOptions";

const FEATURES: {
  key: "doctorSettings" | "pay" | "sms" | "video" | "cancel" | "queueScreen" | "prescriptions";
  name: string;
  note: string;
}[] = [
  { key: "doctorSettings", name: "Settings page on doctor dashboard", note: "lets the doctor edit hours and slots" },
  { key: "pay", name: "Online payment", note: "card and wallet at booking" },
  { key: "sms", name: "SMS and WhatsApp reminders", note: "2 hours before the token" },
  { key: "video", name: "Video consultation", note: "separate fee and token length" },
  { key: "cancel", name: "Patient self-cancel", note: "up to 4 hours before" },
  { key: "queueScreen", name: "Waiting-room queue screen", note: "the public /display screen for a TV or monitor" },
  { key: "prescriptions", name: "Prescription writing", note: "doctor writes one, the store console fills it" },
];

export function SwitchesTab({
  allowedSlotMinutes,
  feat,
}: {
  allowedSlotMinutes: number[];
  feat: Record<string, boolean>;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div>
      <div className="text-[11px] font-extrabold uppercase tracking-[0.1em]">Slot lengths the doctor may pick</div>
      <div className="mt-2 flex border border-divider">
        {SLOT_MINUTE_OPTIONS.map((v, i) => {
          const on = allowedSlotMinutes.includes(v);
          return (
            <button
              key={v}
              disabled={pending}
              onClick={() => startTransition(() => void setAllowedSlotMinutes(v))}
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
      <div className="mt-1.5 text-[11.5px] text-muted">
        {allowedSlotMinutes.length
          ? `The doctor can pick ${allowedSlotMinutes.join(", ")} min per session.`
          : "No lengths enabled — the doctor cannot open a session."}
      </div>

      <div className="mt-5 text-[11px] font-extrabold uppercase tracking-[0.1em]">Switches</div>
      <div className="mt-2">
        {FEATURES.map((f) => {
          const on = feat[f.key];
          return (
            <button
              key={f.key}
              disabled={pending}
              onClick={() => startTransition(() => void toggleFeatureFlag(f.key))}
              className="flex w-full cursor-pointer items-center gap-3 border-b border-divider py-2.5 text-left last:border-b-0"
            >
              <div className="flex-1">
                <div className="text-sm font-extrabold">{f.name}</div>
                <div className="text-[11.5px] text-muted">{f.note}</div>
              </div>
              <div className="flex h-5 w-10 p-0.5" style={{ background: on ? "var(--accent)" : "var(--neutral-300)", justifyContent: on ? "flex-end" : "flex-start" }}>
                <span className="h-4 w-4 bg-white" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
