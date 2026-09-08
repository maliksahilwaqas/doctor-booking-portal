import { requireRole } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { SetupRequired } from "@/components/SetupRequired";

export default async function StoreConsoleLayout({ children }: LayoutProps<"/store">) {
  if (!isSupabaseConfigured()) return <SetupRequired />;
  await requireRole("store");
  return children;
}
