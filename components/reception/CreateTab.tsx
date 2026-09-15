"use client";

import { useState } from "react";
import { WalkInForm } from "./WalkInForm";
import { ScheduleAppointmentForm } from "./ScheduleAppointmentForm";
import type { LocationVM } from "@/components/patient/types";
import type { CurrencyCode } from "@/types/database.types";

export function CreateTab({
  locations,
  currentLocationId,
  today,
  currency,
}: {
  locations: LocationVM[];
  currentLocationId: string;
  today: string;
  currency: CurrencyCode;
}) {
  const [mode, setMode] = useState<"walkin" | "schedule">("walkin");
  const currentLocation = locations.find((l) => l.id === currentLocationId);

  return (
    <div>
      <div className="flex border border-divider">
        <button
          onClick={() => setMode("walkin")}
          className="flex-1 cursor-pointer py-2.5 text-center text-[13px] font-extrabold"
          style={{ background: mode === "walkin" ? "var(--accent)" : "var(--accent-100)", color: mode === "walkin" ? "#fff" : "var(--accent-700)" }}
        >
          WALK-IN TOKEN
        </button>
        <button
          onClick={() => setMode("schedule")}
          className="flex-1 cursor-pointer border-l border-divider py-2.5 text-center text-[13px] font-extrabold"
          style={{ background: mode === "schedule" ? "var(--accent)" : "var(--accent-100)", color: mode === "schedule" ? "#fff" : "var(--accent-700)" }}
        >
          SCHEDULE APPOINTMENT
        </button>
      </div>

      <div className="mt-3">
        {mode === "walkin" ? (
          <>
            <div className="mb-2 text-[11.5px] text-muted">Issues the next free token for the currently selected location, today.</div>
            <WalkInForm locationId={currentLocationId} visitDate={today} currency={currency} fee={currentLocation?.fee ?? 0} />
          </>
        ) : (
          <>
            <div className="mb-2 text-[11.5px] text-muted">Book a specific token, at any location, for today or a future date.</div>
            <ScheduleAppointmentForm locations={locations} today={today} />
          </>
        )}
      </div>
    </div>
  );
}
