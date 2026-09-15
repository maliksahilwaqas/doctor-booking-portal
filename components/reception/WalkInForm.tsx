"use client";

import { useState } from "react";
import Link from "next/link";
import { addWalkIn } from "@/actions/reception";
import { formatMoney } from "@/lib/calc/format";
import { CtaBar, TextField } from "@/components/ui/primitives";
import type { CurrencyCode } from "@/types/database.types";

interface IssuedToken {
  bookingId: string;
  tokenNumber: number;
}

/**
 * Fee collection (or check-in, for a free session) happens before a token
 * ever exists -- "+ Walk-in token" stays disabled until it's confirmed, so
 * there's no way to hand out a token reception hasn't actually collected
 * for yet. See actions/reception.ts's addWalkIn, which inserts the booking
 * already checked in rather than as a separate step afterward.
 */
export function WalkInForm({ locationId, visitDate, currency, fee }: { locationId: string; visitDate: string; currency: CurrencyCode; fee: number }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [received, setReceived] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [issued, setIssued] = useState<IssuedToken | null>(null);

  function updateName(v: string) {
    setName(v);
    setReceived(false);
  }
  function updatePhone(v: string) {
    setPhone(v);
    setReceived(false);
  }

  async function submit() {
    setSubmitting(true);
    setError("");
    setIssued(null);
    const result = await addWalkIn({ locationId, visitDate, patientName: name, patientPhone: phone });
    setSubmitting(false);
    if (result.error || !result.bookingId || result.tokenNumber === undefined) {
      setError(result.error ?? "Could not add walk-in token");
      return;
    }
    setName("");
    setPhone("");
    setReceived(false);
    setIssued({ bookingId: result.bookingId, tokenNumber: result.tokenNumber });
  }

  const detailsReady = name.trim().length > 1 && phone.trim().length >= 7;

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        <TextField label="Name" value={name} onChange={(e) => updateName(e.target.value)} />
        <TextField label="Mobile" value={phone} onChange={(e) => updatePhone(e.target.value)} />
      </div>

      <button
        disabled={!detailsReady}
        onClick={() => setReceived((r) => !r)}
        className="mt-2.5 h-11 w-full cursor-pointer text-[13px] font-extrabold disabled:cursor-not-allowed disabled:opacity-40"
        style={
          received
            ? { background: "var(--accent)", color: "#fff", border: "1.5px solid var(--accent)" }
            : { background: "#fff", color: "var(--accent)", border: "1.5px solid var(--accent)" }
        }
      >
        {fee === 0 ? (received ? "CHECKED IN ✓" : "CHECK IN") : received ? "RECEIVED ✓" : `RECEIVED · ${formatMoney(fee, currency)}`}
      </button>

      {error ? <div className="mt-1.5 text-xs font-bold text-accent-700">{error}</div> : null}
      <CtaBar className="mt-2.5" disabled={!received || submitting} onClick={submit}>
        <span>{submitting ? "ADDING…" : "+ WALK-IN TOKEN"}</span>
      </CtaBar>

      {issued ? (
        <div className="mt-3 flex items-center gap-2 border border-divider bg-surface px-3 py-3">
          <div className="flex-1 text-[11.5px] font-bold text-accent-700">Token {issued.tokenNumber} issued.</div>
          <Link
            href={`/reception/token/${issued.bookingId}`}
            target="_blank"
            className="flex h-9 w-9 flex-none cursor-pointer items-center justify-center border-2 border-ink text-[13px] font-extrabold"
            aria-label="Print token slip"
          >
            T
          </Link>
        </div>
      ) : null}
    </div>
  );
}
