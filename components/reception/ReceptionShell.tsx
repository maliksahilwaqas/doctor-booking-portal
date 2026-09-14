import { signOut } from "@/actions/auth";
import { NotifyDot, TabRow } from "@/components/ui/primitives";

export function ReceptionShell({
  staffName,
  activeTab,
  requestCount,
  buildHref,
  children,
}: {
  staffName: string;
  activeTab: string;
  requestCount: number;
  buildHref: (tab: string) => string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col">
      <div className="flex items-start justify-between gap-3 px-5 pt-6 pb-3.5">
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-accent">Reception console</div>
        </div>
        <div className="flex h-9 w-9 flex-none items-center justify-center bg-ink text-[13px] font-extrabold text-bg">
          {staffName.slice(0, 2).toUpperCase()}
        </div>
      </div>

      <TabRow
        tabs={[
          { key: "queue", label: "QUEUE" },
          {
            key: "requests",
            label: (
              <>
                REQUESTS
                {requestCount > 0 ? <NotifyDot className="absolute top-1.5 right-1.5" /> : null}
              </>
            ),
          },
          { key: "patients", label: "PATIENTS" },
          { key: "create", label: "CREATE" },
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
