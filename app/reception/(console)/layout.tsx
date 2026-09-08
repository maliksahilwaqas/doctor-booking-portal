import { requireRole } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { SetupRequired } from "@/components/SetupRequired";

export default async function ReceptionConsoleLayout({ children }: LayoutProps<"/reception">) {
  if (!isSupabaseConfigured()) return <SetupRequired />;
  await requireRole("reception");
  return children;
}
