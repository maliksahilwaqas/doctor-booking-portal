"use client";

import { useEffect, useState } from "react";
import { PrescriptionsList } from "./PrescriptionsList";
import type { StorePrescription } from "@/lib/data/store";

const POLL_MS = 5000;

/**
 * Polls /api/store-prescriptions so a prescription the doctor just wrote
 * (or reception just marked given, from another terminal) shows up here on
 * its own -- same self-scheduling poll-then-schedule-next loop as
 * components/display/TokenDisplay.tsx and components/doctor/DashboardLive.tsx.
 */
export function PrescriptionsLive({ initialPrescriptions }: { initialPrescriptions: StorePrescription[] }) {
  const [prescriptions, setPrescriptions] = useState(initialPrescriptions);

  useEffect(() => {
    let cancelled = false;
    let nextPollTimer: ReturnType<typeof setTimeout> | null = null;

    async function poll() {
      try {
        const res = await fetch("/api/store-prescriptions", { cache: "no-store" });
        if (!cancelled && res.ok) {
          const data = await res.json();
          if (Array.isArray(data.prescriptions)) setPrescriptions(data.prescriptions);
        }
      } catch {
        // Network blip -- next cycle tries again.
      } finally {
        if (!cancelled) nextPollTimer = setTimeout(poll, POLL_MS);
      }
    }

    function pollNow() {
      if (nextPollTimer) clearTimeout(nextPollTimer);
      void poll();
    }

    poll();
    function onWake() {
      if (document.visibilityState === "visible") pollNow();
    }
    document.addEventListener("visibilitychange", onWake);
    window.addEventListener("focus", onWake);
    window.addEventListener("online", onWake);

    return () => {
      cancelled = true;
      if (nextPollTimer) clearTimeout(nextPollTimer);
      document.removeEventListener("visibilitychange", onWake);
      window.removeEventListener("focus", onWake);
      window.removeEventListener("online", onWake);
    };
  }, []);

  return <PrescriptionsList prescriptions={prescriptions} />;
}
