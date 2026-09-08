import { requireRole } from "@/lib/auth";
import { getDoctorProfile } from "@/lib/data/profile";
import { getAllLocations } from "@/lib/data/locations";
import { AdminShell } from "@/components/admin/AdminShell";
import { ProfileTab } from "@/components/admin/ProfileTab";
import { BrandingTab } from "@/components/admin/BrandingTab";
import { LocationsTab } from "@/components/admin/LocationsTab";
import { SwitchesTab } from "@/components/admin/SwitchesTab";

export default async function AdminConsolePage(props: PageProps<"/admin">) {
  const searchParams = await props.searchParams;
  const tab = typeof searchParams.tab === "string" ? searchParams.tab : "profile";

  const [, profile, locations] = await Promise.all([requireRole("admin"), getDoctorProfile(), getAllLocations()]);

  let content: React.ReactNode;
  if (tab === "branding") {
    content = (
      <BrandingTab
        accent={profile.accent}
        sessionLabels={profile.sessionLabels}
        locationTerm={profile.locationTerm}
        currency={profile.currency}
        bookingWindowDays={profile.bookingWindowDays}
        overbookPerSession={profile.overbookPerSession}
      />
    );
  } else if (tab === "locations") {
    content = (
      <LocationsTab
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
          active: l.active,
        }))}
        currency={profile.currency}
      />
    );
  } else if (tab === "switches") {
    content = <SwitchesTab allowedSlotMinutes={profile.allowedSlotMinutes} feat={profile.feat} />;
  } else {
    content = (
      <ProfileTab
        profile={{
          name: profile.name,
          speciality: profile.speciality,
          quals: profile.quals,
          phone: profile.phone,
          clinicName: profile.clinicName,
          address: profile.address,
        }}
      />
    );
  }

  return (
    <AdminShell doctorName={profile.name} activeTab={tab} buildHref={(t) => `/admin?tab=${t}`}>
      {content}
    </AdminShell>
  );
}
