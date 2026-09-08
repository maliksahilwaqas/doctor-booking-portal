"use client";

import { useState } from "react";
import { addWalkIn } from "@/actions/reception";
import { CtaBar, TextField } from "@/components/ui/primitives";

export function WalkInForm({ locationId, visitDate }: { locationId: string; visitDate: string }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [added, setAdded] = useState(false);

  async function submit() {
    setSubmitting(true);
    setError("");
    setAdded(false);
    const result = await addWalkIn({ locationId, visitDate, patientName: name, patientPhone: phone });
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setName("");
    setPhone("");
    setAdded(true);
  }

  const canSubmit = name.trim().length > 1 && phone.trim().length >= 7;

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <TextField label="Mobile" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      {error ? <div className="mt-1.5 text-xs font-bold text-accent-700">{error}</div> : null}
      <CtaBar className="mt-2.5" disabled={!canSubmit || submitting} onClick={submit}>
        <span>{submitting ? "ADDING…" : "+ WALK-IN TOKEN"}</span>
      </CtaBar>
      {added ? <div className="mt-1.5 text-[11.5px] font-bold text-accent-700">Token issued for the current session.</div> : null}
    </div>
  );
}
