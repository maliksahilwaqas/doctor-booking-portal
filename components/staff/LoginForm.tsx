"use client";

import { useActionState } from "react";
import { signIn, type SignInState } from "@/actions/auth";

const initialState: SignInState = {};

const FIELD_LABEL = "block text-[11px] font-bold uppercase tracking-[0.2em]" as const;
const FIELD_INPUT =
  "h-[52px] w-full border-[1.5px] bg-[rgba(9,12,34,0.62)] px-3.5 text-[16px] font-semibold text-white outline-none placeholder:text-white/40 focus-visible:border-white" as const;

/**
 * Dark, full-bleed sign-in form matching the Ordinal Sign In v1 design
 * handoff -- deliberately its own styling rather than the shared
 * TextField/CtaBar primitives, which are tuned for the app's light "paper"
 * pages. Same server-action wiring as before (signIn, the hidden `next`
 * redirect target, pending/error state); only the look changed.
 */
export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="flex w-full flex-col gap-5">
      <input type="hidden" name="next" value={next} />

      <div className="flex flex-col gap-2">
        <label htmlFor="ord-email" className={FIELD_LABEL} style={{ color: "var(--accent-400)" }}>
          Email
        </label>
        <input
          id="ord-email"
          name="email"
          type="email"
          autoComplete="username"
          required
          placeholder="you@clinic.com"
          className={FIELD_INPUT}
          style={{ borderColor: "rgba(255,255,255,0.42)" }}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="ord-pass" className={FIELD_LABEL} style={{ color: "var(--accent-400)" }}>
          Password
        </label>
        <input
          id="ord-pass"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          className={FIELD_INPUT}
          style={{ borderColor: "rgba(255,255,255,0.42)" }}
        />
      </div>

      {state.error ? <div className="text-[12.5px] font-bold text-red-300">{state.error}</div> : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 flex h-[56px] w-full cursor-pointer items-center justify-center text-[15px] font-extrabold tracking-[0.14em] uppercase text-[#0d1447] transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        style={{ background: "#ffffff" }}
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
