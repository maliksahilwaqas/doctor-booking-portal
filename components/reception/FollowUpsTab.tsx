import Link from "next/link";
import { SectionHeading } from "@/components/ui/primitives";
import type { FollowUp } from "@/lib/data/prescriptions";

function formatFollowUpDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
}

/**
 * Soonest-due first, across every location -- for reception to work through
 * manually (call/text) until a WhatsApp integration exists to do it
 * automatically. See lib/data/prescriptions.ts's getUpcomingFollowUps.
 */
export function FollowUpsTab({ followUps, backHref }: { followUps: FollowUp[]; backHref: string }) {
  return (
    <div>
      <Link href={backHref} className="text-[11px] font-extrabold uppercase tracking-[0.04em] text-muted underline">
        ← Back to patients
      </Link>

      <div className="mt-3">
        <SectionHeading meta={`${followUps.length} scheduled`}>Follow-ups</SectionHeading>
        {followUps.length === 0 ? (
          <div className="border border-divider bg-surface p-4 text-sm text-muted">No follow-ups scheduled.</div>
        ) : (
          <div className="mt-2">
            {followUps.map((f) => (
              <div key={f.bookingId} className="flex items-center gap-3 border-b border-divider py-2.5 last:border-b-0">
                <div className="w-[74px] flex-none">
                  <div className="text-sm font-extrabold">{formatFollowUpDate(f.followUpDate)}</div>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-extrabold">{f.patientName}</div>
                  <div className="text-[11.5px] font-bold text-muted">{f.patientPhone}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
