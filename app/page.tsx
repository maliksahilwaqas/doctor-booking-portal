import { isSupabaseConfigured } from "@/lib/supabase/env";
import { SetupRequired } from "@/components/SetupRequired";
import { getDoctorProfile } from "@/lib/data/profile";
import { getActiveLocations } from "@/lib/data/locations";
import { PatientBookingApp } from "@/components/patient/PatientBookingApp";

export default async function HomePage() {
  if (!isSupabaseConfigured()) return <SetupRequired />;

  const [profile, locations] = await Promise.all([getDoctorProfile(), getActiveLocations()]);

  return (
    <main className="mx-auto w-full max-w-xl px-5 py-7">
      <PatientBookingApp
        locations={locations.map((l) => ({
          id: l.id,
          name: l.name,
          area: l.area,
          session: l.session,
          days: l.days,
          fromMin: l.fromMin,
          toMin: l.toMin,
          slotMin: l.slotMin,
          fee: l.fee,
          followUpFee: l.followUpFee,
          detail: l.detail,
        }))}
        currency={profile.currency}
        sessionLabels={profile.sessionLabels}
        offDays={profile.offDays}
        bookingWindowDays={profile.bookingWindowDays}
        doctorName={profile.name}
        speciality={profile.speciality}
        quals={profile.quals}
        clinicPhone={profile.phone}
      />
    </main>
  );
}
