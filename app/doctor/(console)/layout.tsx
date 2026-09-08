import { requireRole } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { SetupRequired } from "@/components/SetupRequired";

export default async function DoctorConsoleLayout({ children }: LayoutProps<"/doctor">) {
  if (!isSupabaseConfigured()) return <SetupRequired />;
  await requireRole("doctor");
  return children;
}
