import { requireRole } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { SetupRequired } from "@/components/SetupRequired";

export default async function AdminConsoleLayout({ children }: LayoutProps<"/admin">) {
  if (!isSupabaseConfigured()) return <SetupRequired />;
  await requireRole("admin");
  return children;
}
