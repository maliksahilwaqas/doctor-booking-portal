"use client";

import Link from "next/link";
import { useTransition } from "react";
import { toggleDispensed } from "@/actions/store";
import { SectionHeading } from "@/components/ui/primitives";
import type { StorePrescription } from "@/lib/data/store";

export function PrescriptionsList({ prescriptions }: { prescriptions: StorePrescription[] }) {
  const [pending, startTransition] = useTransition();
  const given = prescriptions.filter((p) => p.dispensed).length;

  return (
    <div>
      <SectionHeading meta={`${given} of ${prescriptions.length} given`}>Today&apos;s prescriptions</SectionHeading>
      {prescriptions.length === 0 ? (
        <div className="border border-divider bg-surface p-4 text-sm text-muted">
          No prescriptions to fill yet -- they show up here once the doctor has seen a patient and written one.
        </div>
      ) : (
        <div className="mt-2">
          {prescriptions.map((p) => (
            <div key={p.bookingId} className="flex items-center gap-3 border-b border-divider py-2.5 last:border-b-0">
              <div className="flex-1">
                <div className="text-sm font-extrabold">{p.patientName}</div>
                <div className="text-[11.5px] font-bold text-muted">{p.patientPhone}</div>
                <div className="text-[11.5px] text-muted">
                  {p.items.length} medicine{p.items.length === 1 ? "" : "s"}
                </div>
              </div>
              <Link
                href={`/store/${p.bookingId}`}
                className="flex-none cursor-pointer border-2 border-ink px-2.5 py-1.5 text-[11px] font-extrabold"
              >
                PRESCRIPTION
              </Link>
              <button
                disabled={pending}
                onClick={() => startTransition(() => void toggleDispensed(p.prescriptionId))}
                className="cursor-pointer px-2.5 py-1.5 text-xs font-extrabold text-white"
                style={{ background: p.dispensed ? "var(--accent-700)" : "var(--accent)" }}
              >
                {p.dispensed ? "GIVEN ✓" : "MARK GIVEN"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
