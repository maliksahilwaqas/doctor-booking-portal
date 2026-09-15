"use client";

import { useEffect, useState } from "react";
import { RequestsTab } from "./RequestsTab";
import type { BookingRow } from "@/lib/data/bookings";
import type { CurrencyCode } from "@/types/database.types";

const POLL_MS = 5000;

/** Polls /api/pending-requests so a new online booking request shows up without a reload -- same pattern as PrescriptionsLive/DashboardLive. */
export function RequestsLive({
  initialRequests,
  locationNames,
  currency,
}: {
  initialRequests: BookingRow[];
  locationNames: Record<string, string>;
  currency: CurrencyCode;
}) {
  const [requests, setRequests] = useState(initialRequests);

  useEffect(() => {
    let cancelled = false;
    let nextPollTimer: ReturnType<typeof setTimeout> | null = null;

    async function poll() {
      try {
        const res = await fetch("/api/pending-requests", { cache: "no-store" });
        if (!cancelled && res.ok) {
          const data = await res.json();
          if (Array.isArray(data.requests)) setRequests(data.requests);
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

  return <RequestsTab requests={requests} locationNames={locationNames} currency={currency} />;
}
