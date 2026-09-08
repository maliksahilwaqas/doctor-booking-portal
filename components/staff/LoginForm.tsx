"use client";

import { useActionState } from "react";
import { signIn, type SignInState } from "@/actions/auth";
import { CtaBar, TextField } from "@/components/ui/primitives";

const initialState: SignInState = {};

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="flex w-full max-w-xs flex-col gap-3.5">
      <input type="hidden" name="next" value={next} />
      <TextField label="Email" name="email" type="email" autoComplete="username" required />
      <TextField label="Password" name="password" type="password" autoComplete="current-password" required />
      {state.error ? <div className="text-[12.5px] font-bold text-accent-700">{state.error}</div> : null}
      <CtaBar type="submit" disabled={pending} className="mt-1.5">
        <span>{pending ? "SIGNING IN…" : "SIGN IN"}</span>
      </CtaBar>
    </form>
  );
}
