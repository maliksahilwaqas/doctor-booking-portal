import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { SetupRequired } from "@/components/SetupRequired";
import { getStorePrescription } from "@/lib/data/store";
import { getDoctorProfile } from "@/lib/data/profile";
import { PrescriptionDocument } from "@/components/store/PrescriptionDocument";
import { PrintButton } from "@/components/store/PrintButton";
import { ShareButton } from "@/components/store/ShareButton";
import { DispenseButton } from "@/components/store/DispenseButton";

export default async function StorePrescriptionPage(props: PageProps<"/store/[bookingId]">) {
  if (!isSupabaseConfigured()) return <SetupRequired />;
  const staff = await requireRole(["store", "reception"]);

  const { bookingId } = await props.params;
  const [prescription, profile] = await Promise.all([getStorePrescription(bookingId), getDoctorProfile()]);
  if (!prescription) notFound();

  const doctor = {
    name: profile.name,
    speciality: profile.speciality,
    quals: profile.quals,
    phone: profile.phone,
    address: profile.address,
    clinicName: profile.clinicName,
  };

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="print:hidden flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-5 py-4">
        <Link
          href={staff.role === "store" ? "/store" : "/reception?tab=patients"}
          className="text-[11px] font-extrabold uppercase tracking-[0.04em] whitespace-nowrap text-muted underline"
        >
          ← Back
        </Link>
        <div className="flex flex-wrap items-start gap-2">
          {staff.role === "store" ? (
            <DispenseButton prescriptionId={prescription.prescriptionId} dispensed={prescription.dispensed} />
          ) : null}
          <PrintButton />
          <ShareButton
            data={{
              doctor,
              patientName: prescription.patientName,
              patientPhone: prescription.patientPhone,
              tokenNumber: prescription.tokenNumber,
              visitDate: prescription.visitDate,
              items: prescription.items,
              notes: prescription.notes,
              followUpDays: prescription.followUpDays,
              issuedAt: prescription.createdAt,
            }}
            fileName={`Prescription - ${prescription.patientName} - ${prescription.visitDate}.pdf`}
          />
        </div>
      </div>

      <div className="border border-divider print:border-0">
        <PrescriptionDocument
          doctor={doctor}
          patientName={prescription.patientName}
          patientPhone={prescription.patientPhone}
          tokenNumber={prescription.tokenNumber}
          visitDate={prescription.visitDate}
          items={prescription.items}
          notes={prescription.notes}
          followUpDays={prescription.followUpDays}
          issuedAt={prescription.createdAt}
        />
      </div>
    </div>
  );
}
