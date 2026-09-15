"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { addWalkIn, receivePayment, toggleCheckedIn } from "@/actions/reception";
import { formatMoney } from "@/lib/calc/format";
import { CtaBar, TextField } from "@/components/ui/primitives";
import type { CurrencyCode } from "@/types/database.types";

interface AddedToken {
  bookingId: string;
  tokenNumber: number;
  fee: number;
  received: boolean;
}

export function WalkInForm({ locationId, visitDate, currency }: { locationId: string; visitDate: string; currency: CurrencyCode }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [added, setAdded] = useState<AddedToken | null>(null);
  const [pending, startTransition] = useTransition();

  async function submit() {
    setSubmitting(true);
    setError("");
    setAdded(null);
    const result = await addWalkIn({ locationId, visitDate, patientName: name, patientPhone: phone });
    setSubmitting(false);
    if (result.error || !result.bookingId || result.tokenNumber === undefined || result.fee === undefined) {
      setError(result.error ?? "Could not add walk-in token");
      return;
    }
    setName("");
    setPhone("");
    setAdded({ bookingId: result.bookingId, tokenNumber: result.tokenNumber, fee: result.fee, received: result.fee === 0 });
  }

  // A zero-fee walk-in just needs a check-in; a paid one is checked in by
  // collecting the fee -- same rule the Queue tab's rows follow.
  function collect() {
    if (!added) return;
    startTransition(async () => {
      const action = added.fee === 0 ? toggleCheckedIn(added.bookingId) : receivePayment(added.bookingId);
      const result = await action;
      if (!result.error) setAdded({ ...added, received: true });
    });
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

      {added ? (
        <div className="mt-3 border border-divider bg-surface px-3 py-3">
          <div className="text-[11.5px] font-bold text-accent-700">Token {added.tokenNumber} issued.</div>
          <div className="mt-2 flex items-center gap-2">
            {!added.received ? (
              <button
                disabled={pending}
                onClick={collect}
                className="h-10 flex-1 cursor-pointer text-[12.5px] font-extrabold"
                style={{ background: "#fff", color: "var(--accent)", border: "1.5px solid var(--accent)" }}
              >
                {pending ? "COLLECTING…" : added.fee === 0 ? "CHECK IN" : `COLLECT FEE · ${formatMoney(added.fee, currency)}`}
              </button>
            ) : (
              <>
                <div
                  className="flex h-10 flex-1 cursor-default items-center justify-center text-[12.5px] font-extrabold text-white"
                  style={{ background: "var(--accent)" }}
                >
                  {added.fee === 0 ? "CHECKED IN ✓" : "RECEIVED ✓"}
                </div>
                <Link
                  href={`/reception/token/${added.bookingId}`}
                  target="_blank"
                  className="flex h-10 w-10 flex-none cursor-pointer items-center justify-center border-2 border-ink text-[13px] font-extrabold"
                  aria-label="Print token slip"
                >
                  T
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
