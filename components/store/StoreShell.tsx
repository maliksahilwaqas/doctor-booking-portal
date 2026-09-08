import { signOut } from "@/actions/auth";

export function StoreShell({ staffName, children }: { staffName: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col">
      <div className="flex items-start justify-between gap-3 px-5 pt-6 pb-3.5">
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-accent">Store console</div>
        </div>
        <div className="flex h-9 w-9 flex-none items-center justify-center bg-ink text-[13px] font-extrabold text-bg">
          {staffName.slice(0, 2).toUpperCase()}
        </div>
      </div>

      <div className="flex-1 border-t-2 border-divider px-5 py-5">{children}</div>

      <form action={signOut} className="px-5 pb-6">
        <button type="submit" className="cursor-pointer text-[11px] font-bold uppercase tracking-[0.04em] text-muted underline">
          Sign out
        </button>
      </form>
    </div>
  );
}
