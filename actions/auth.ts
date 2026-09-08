"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface SignInState {
  error?: string;
}

const ROLE_HOME: Record<string, string> = {
  reception: "/reception",
  doctor: "/doctor",
  admin: "/admin",
  store: "/store",
};

export async function signIn(_prevState: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");

  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: "Incorrect email or password." };

  if (next.startsWith("/")) redirect(next);

  const { data: staff } = await supabase
    .from("staff")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();
  redirect(staff ? ROLE_HOME[staff.role] : "/staff/login");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/staff/login");
}
