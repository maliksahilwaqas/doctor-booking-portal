"use client";

import { useState } from "react";
import { updateProfile } from "@/actions/admin";
import { CtaBar, TextField } from "@/components/ui/primitives";

export interface ProfileFields {
  name: string;
  speciality: string;
  quals: string;
  phone: string;
  clinicName: string;
  address: string;
}

export function ProfileTab({ profile }: { profile: ProfileFields }) {
  const [fields, setFields] = useState(profile);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof ProfileFields>(key: K, value: string) {
    setFields((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const result = await updateProfile(fields);
      if (result.error) setError(result.error);
      else setSaved(true);
    } catch {
      // A stale page open across a deploy can make the server action call
      // itself fail instead of returning a normal error -- without this,
      // the button would stay stuck on "Saving..." forever.
      setError("Couldn't reach the server. Refresh the page and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="text-[11px] font-extrabold uppercase tracking-[0.1em]">Doctor profile</div>
      <div className="mt-2.5 flex flex-col gap-2.5">
        <TextField label="Doctor name" value={fields.name} onChange={(e) => set("name", e.target.value)} />
        <TextField label="Speciality" value={fields.speciality} onChange={(e) => set("speciality", e.target.value)} />
        <TextField label="Qualifications" value={fields.quals} onChange={(e) => set("quals", e.target.value)} />
        <TextField label="Reception number" value={fields.phone} onChange={(e) => set("phone", e.target.value)} />
        <TextField label="Practice name" value={fields.clinicName} onChange={(e) => set("clinicName", e.target.value)} />
        <TextField label="Address" value={fields.address} onChange={(e) => set("address", e.target.value)} />
      </div>

      {error ? <div className="mt-2 text-xs font-bold text-accent-700">{error}</div> : null}
      <CtaBar className="mt-3" disabled={saving} onClick={save}>
        <span>{saving ? "SAVING…" : "SAVE PROFILE"}</span>
      </CtaBar>
      {saved ? <div className="mt-1.5 text-[11.5px] font-bold text-accent-700">Saved.</div> : null}

      <div className="mt-5 text-[11px] font-extrabold uppercase tracking-[0.1em]">Images</div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="border border-divider p-2.5">
          <div className="h-16 bg-neutral-200 p-1 text-[9px] text-muted">Doctor photo</div>
          <div className="mt-2 text-xs font-extrabold text-muted">Photo uploads aren&apos;t wired up yet</div>
        </div>
        <div className="border border-divider p-2.5">
          <div className="h-16 bg-neutral-200 p-1 text-[9px] text-muted">Clinic photos · 0</div>
          <div className="mt-2 text-xs font-extrabold text-muted">Photo uploads aren&apos;t wired up yet</div>
        </div>
      </div>
    </div>
  );
}
