import { requireRole } from "@/lib/auth";
import { getTodayPrescriptionsForStore } from "@/lib/data/store";
import { StoreShell } from "@/components/store/StoreShell";
import { PrescriptionsLive } from "@/components/store/PrescriptionsLive";

export default async function StoreConsolePage() {
  const [staff, prescriptions] = await Promise.all([requireRole("store"), getTodayPrescriptionsForStore()]);

  return (
    <StoreShell staffName={staff.fullName}>
      <PrescriptionsLive initialPrescriptions={prescriptions} />
    </StoreShell>
  );
}
