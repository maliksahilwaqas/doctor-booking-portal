function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

/**
 * A thermal-receipt-sized slip -- @page below is scoped to this route only
 * (globals.css's A4 @page rule is for the prescription PDF, printed from a
 * different route, so they can't share one @page without fighting).
 */
export function TokenSlipDocument({ tokenNumber, patientName, visitDate }: { tokenNumber: number; patientName: string; visitDate: string }) {
  return (
    <div className="mx-auto w-[80mm] max-w-full px-4 py-6 text-center print:w-[80mm] print:px-2 print:py-3">
      <style>{`@media print { @page { size: 80mm auto; margin: 3mm; } }`}</style>
      <div className="text-[11px] font-extrabold tracking-[0.14em] text-muted uppercase">Token</div>
      <div className="mt-1 text-[96px] leading-none font-extrabold">{tokenNumber}</div>
      <div className="mt-4 text-lg font-extrabold">{patientName}</div>
      <div className="mt-1 text-sm font-bold text-muted">{formatDate(visitDate)}</div>
    </div>
  );
}
