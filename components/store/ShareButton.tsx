"use client";

import { useState } from "react";
import { buildPrescriptionPdf, type PrescriptionPdfData } from "@/lib/pdf/prescription";

/**
 * Builds the same A4 PDF as the Print button prints, then hands it to the
 * device's native share sheet (WhatsApp, email, AirDrop, etc.) via the Web
 * Share API's file support. Falls back to a plain download wherever that
 * isn't available (older browsers, most desktop browsers outside Chrome).
 */
export function ShareButton({ data, fileName }: { data: PrescriptionPdfData; fileName: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function share() {
    setBusy(true);
    setError("");
    try {
      const doc = buildPrescriptionPdf(data);
      const blob = doc.output("blob");
      const file = new File([blob], fileName, { type: "application/pdf" });

      if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: fileName });
      } else {
        doc.save(fileName);
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") setError("Could not share the prescription.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        disabled={busy}
        onClick={share}
        className="cursor-pointer whitespace-nowrap border-2 border-ink bg-ink px-3 py-2 text-[12.5px] font-extrabold text-bg disabled:opacity-50 sm:px-4"
      >
        {busy ? "PREPARING…" : "SHARE"}
      </button>
      {error ? <div className="mt-1 text-xs font-bold text-accent-700">{error}</div> : null}
    </div>
  );
}
