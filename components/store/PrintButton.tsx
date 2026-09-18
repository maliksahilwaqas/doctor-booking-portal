"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="cursor-pointer whitespace-nowrap border-2 border-ink bg-ink px-3 py-2 text-[12.5px] font-extrabold text-bg sm:px-4"
    >
      PRINT
    </button>
  );
}
