import { isSupabaseConfigured } from "@/lib/supabase/env";
import { SetupRequired } from "@/components/SetupRequired";
import { LoginForm } from "@/components/staff/LoginForm";

export default async function StaffLoginPage(props: PageProps<"/staff/login">) {
  if (!isSupabaseConfigured()) return <SetupRequired />;
  const searchParams = await props.searchParams;
  const next = typeof searchParams.next === "string" ? searchParams.next : "";

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-5">
      <div className="text-center">
        <div className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-accent">Staff console</div>
        <h1 className="mt-1.5 text-2xl font-extrabold">Sign in</h1>
      </div>
      <LoginForm next={next} />
    </main>
  );
}
