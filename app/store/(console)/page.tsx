import { requireRole } from "@/lib/auth";
import { getTodayPrescriptionsForStore } from "@/lib/data/store";
import { StoreShell } from "@/components/store/StoreShell";
import { PrescriptionsList } from "@/components/store/PrescriptionsList";

export default async function StoreConsolePage() {
  const [staff, prescriptions] = await Promise.all([requireRole("store"), getTodayPrescriptionsForStore()]);

  return (
    <StoreShell staffName={staff.fullName}>
      <PrescriptionsList prescriptions={prescriptions} />
    </StoreShell>
  );
}
