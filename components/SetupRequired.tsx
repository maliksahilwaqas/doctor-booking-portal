export function SetupRequired() {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-3 px-6 py-24 text-center">
      <div className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-accent">Setup required</div>
      <h1 className="text-2xl font-extrabold">Connect a Supabase project</h1>
      <p className="text-sm leading-relaxed text-muted">
        This instance has no <code>NEXT_PUBLIC_SUPABASE_URL</code> / <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> set.
        Follow the README to create a Supabase project, run the migrations in{" "}
        <code>supabase/migrations</code>, and add your keys to <code>.env.local</code>.
      </p>
    </div>
  );
}
