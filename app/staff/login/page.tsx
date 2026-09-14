import { isSupabaseConfigured } from "@/lib/supabase/env";
import { SetupRequired } from "@/components/SetupRequired";
import { LoginForm } from "@/components/staff/LoginForm";

// Matches the Ordinal Sign In v1 design handoff, with --accent (the admin's
// chosen brand color, see lib/calc/accents.ts) standing in for the design's
// own hardcoded blue -- close to identical for the default theme, and
// correct for the other four.
const BRAND_GRADIENT = "linear-gradient(168deg, #0d0e12 0%, #101431 34%, #16204a 58%, var(--accent) 100%)";

function FooterTag() {
  return (
    <>
      <div className="text-[11px] font-bold tracking-[0.2em] uppercase" style={{ color: "var(--accent-400)" }}>
        Ordinal
      </div>
      <div className="text-[11px] font-semibold text-white/55">v1.0</div>
    </>
  );
}

export default async function StaffLoginPage(props: PageProps<"/staff/login">) {
  if (!isSupabaseConfigured()) return <SetupRequired />;
  const searchParams = await props.searchParams;
  const next = typeof searchParams.next === "string" ? searchParams.next : "";

  return (
    <main className="relative flex min-h-dvh w-full flex-col overflow-hidden text-white lg:flex-row" style={{ background: BRAND_GRADIENT }}>
      {/* Brand panel -- transparent, so on mobile it's just the top of the
          one continuous gradient covering the whole page (matching the
          design handoff). At lg+ the form panel turns opaque instead,
          which is what actually splits the page into two panels. No
          overflow-hidden here: on mobile the decorative "T" below is meant
          to spill out past this panel's own (content-sized, i.e. short)
          box into the empty space above the footer -- the form panel
          behind it is transparent at that width, so nothing clips it.
          Percentage position/size stay relative to *this* panel's own
          width rather than the full page, so at lg+, where this panel is
          the narrower fixed-width column, the glyph stays confined to it
          instead of spilling into the opaque form panel next door. */}
      <div className="relative flex flex-none flex-col px-6 py-7 sm:px-10 sm:py-9 lg:w-[42%] lg:min-w-[440px] lg:px-14 lg:py-12">
        <div aria-hidden className="login-t-glyph pointer-events-none absolute font-black select-none">
          T
        </div>

        <div className="relative flex items-stretch gap-4">
          <div className="grid w-[52px] flex-none place-items-center bg-white sm:w-[58px]" style={{ color: "var(--accent)" }}>
            <span className="block font-black leading-[0.72]" style={{ fontSize: 62 }}>
              O
            </span>
          </div>
          <div className="flex flex-col justify-center gap-1">
            <div className="text-[32px] leading-[0.9] font-black tracking-[-0.045em] sm:text-[38px]">Ordinal</div>
            <div className="text-right text-[10px] font-bold tracking-[0.3em] uppercase" style={{ color: "var(--accent-400)" }}>
              Clinic system
            </div>
          </div>
        </div>

        <div className="relative mt-auto hidden max-w-[20ch] pt-16 text-[28px] leading-[1.15] font-extrabold tracking-[-0.02em] lg:block">
          Every visit, one number, start to finish.
        </div>

        <div
          className="relative mt-10 hidden items-baseline justify-between border-t pt-4 lg:flex"
          style={{ borderColor: "rgba(255,255,255,0.16)" }}
        >
          <FooterTag />
        </div>
      </div>

      {/* Form panel -- fills whatever width the brand panel doesn't take,
          so there's no leftover blank margin on a wide screen. Opaque only
          from lg up, which is what actually creates the two-panel split;
          below that it stays transparent so the gradient behind it
          (painted on <main>) reads as one continuous background. */}
      <div className="relative flex flex-1 flex-col px-6 py-10 sm:px-10 lg:justify-center lg:bg-[#0d0e12] lg:px-16">
        <div className="mx-auto flex w-full max-w-[360px] flex-col gap-6 pt-6 lg:pt-0">
          <div className="flex flex-col gap-1.5">
            <div className="text-[11px] font-bold tracking-[0.26em] uppercase" style={{ color: "var(--accent-400)" }}>
              Sign in
            </div>
            <h1 className="text-[30px] leading-[1.05] font-extrabold tracking-[-0.03em] sm:text-[32px]">Welcome</h1>
          </div>
          <LoginForm next={next} />
        </div>

        <div className="mx-auto mt-auto flex w-full max-w-[360px] items-baseline justify-between pt-10 lg:hidden">
          <FooterTag />
        </div>
      </div>
    </main>
  );
}
