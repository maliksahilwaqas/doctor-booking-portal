"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="cursor-pointer border-2 border-ink bg-ink px-4 py-2 text-[12.5px] font-extrabold text-bg"
    >
      PRINT
    </button>
  );
}
