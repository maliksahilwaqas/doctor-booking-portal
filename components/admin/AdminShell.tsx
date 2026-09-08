import { signOut } from "@/actions/auth";
import { TabRow } from "@/components/ui/primitives";

export function AdminShell({
  doctorName,
  activeTab,
  buildHref,
  children,
}: {
  doctorName: string;
  activeTab: string;
  buildHref: (tab: string) => string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col">
      <div className="bg-ink px-5 pt-6 pb-3.5 text-bg">
        <div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-accent-400">Admin panel · internal</div>
        <h1 className="mt-1 text-[26px] font-extrabold text-bg">{doctorName}</h1>
        <div className="mt-1 text-[12.5px] opacity-75">One database, one doctor. Every deployment is set up here before handover.</div>
      </div>

      <TabRow
        tabs={[
          { key: "profile", label: "PROFILE" },
          { key: "branding", label: "BRANDING" },
          { key: "locations", label: "LOCATIONS" },
          { key: "switches", label: "SWITCHES" },
        ]}
        active={activeTab}
        hrefFor={buildHref}
      />

      <div className="flex-1 px-5 py-5">{children}</div>

      <form action={signOut} className="px-5 pb-6">
        <button type="submit" className="cursor-pointer text-[11px] font-bold uppercase tracking-[0.04em] text-muted underline">
          Sign out
        </button>
      </form>
    </div>
  );
}
