import { signOut } from "@/actions/auth";
import { TabRow } from "@/components/ui/primitives";

export function DoctorShell({
  doctorName,
  activeTab,
  showSettings,
  buildHref,
  children,
}: {
  doctorName: string;
  activeTab: string;
  showSettings: boolean;
  buildHref: (tab: string) => string;
  children: React.ReactNode;
}) {
  const tabs = [
    { key: "dashboard", label: "DASHBOARD" },
    { key: "schedule", label: "SCHEDULE" },
    { key: "earnings", label: "EARNINGS" },
    ...(showSettings ? [{ key: "settings", label: "SETTINGS" }] : []),
  ];

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col">
      <div className="px-5 pt-6 pb-3.5">
        <div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-accent">Doctor dashboard</div>
        <h1 className="mt-1 text-[26px] font-extrabold">{doctorName}</h1>
      </div>

      <TabRow tabs={tabs} active={activeTab} hrefFor={buildHref} />

      <div className="flex-1 px-5 py-5">{children}</div>

      <form action={signOut} className="px-5 pb-6">
        <button type="submit" className="cursor-pointer text-[11px] font-bold uppercase tracking-[0.04em] text-muted underline">
          Sign out
        </button>
      </form>
    </div>
  );
}
