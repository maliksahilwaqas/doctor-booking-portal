"use client";

import { useState } from "react";
import { WalkInForm } from "./WalkInForm";
import { ScheduleAppointmentForm } from "./ScheduleAppointmentForm";
import type { LocationVM } from "@/components/patient/types";

export function CreateTab({
  locations,
  currentLocationId,
  currentDate,
  today,
}: {
  locations: LocationVM[];
  currentLocationId: string;
  currentDate: string;
  today: string;
}) {
  const [mode, setMode] = useState<"walkin" | "schedule">("walkin");

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
            <div className="mb-2 text-[11.5px] text-muted">
              Issues the next free token for the currently selected location and date.
            </div>
            <WalkInForm locationId={currentLocationId} visitDate={currentDate} />
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
