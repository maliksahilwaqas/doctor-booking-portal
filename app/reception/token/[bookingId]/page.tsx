import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { SetupRequired } from "@/components/SetupRequired";
import { getBookingSlip } from "@/lib/data/bookings";
import { TokenSlipDocument } from "@/components/reception/TokenSlipDocument";
import { PrintButton } from "@/components/store/PrintButton";

export default async function TokenSlipPage(props: PageProps<"/reception/token/[bookingId]">) {
  if (!isSupabaseConfigured()) return <SetupRequired />;
  await requireRole("reception");

  const { bookingId } = await props.params;
  const slip = await getBookingSlip(bookingId);
  if (!slip) notFound();

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="flex items-center justify-between gap-3 px-5 py-4 print:hidden">
        <Link href="/reception?tab=queue" className="text-[11px] font-extrabold tracking-[0.04em] text-muted uppercase underline">
          ← Back
        </Link>
        <PrintButton />
      </div>

      <div className="border border-divider print:border-0">
        <TokenSlipDocument tokenNumber={slip.tokenNumber} patientName={slip.patientName} visitDate={slip.visitDate} />
      </div>
    </div>
  );
}
