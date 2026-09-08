"use client";

import { useTransition } from "react";
import { toggleDispensed } from "@/actions/store";

export function DispenseButton({ prescriptionId, dispensed }: { prescriptionId: string; dispensed: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => void toggleDispensed(prescriptionId))}
      className="cursor-pointer px-4 py-2 text-[12.5px] font-extrabold"
      style={{
        border: `2px solid ${dispensed ? "var(--accent-700)" : "var(--accent)"}`,
        background: dispensed ? "var(--accent-700)" : "var(--accent)",
        color: "#fff",
      }}
    >
      {dispensed ? "GIVEN ✓ -- UNDO" : "MARK AS GIVEN"}
    </button>
  );
}
