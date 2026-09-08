import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { StaffRole } from "@/types/database.types";

export interface CurrentStaff {
  id: string;
  fullName: string;
  email: string;
  role: StaffRole;
}

const ROLE_HOME: Record<StaffRole, string> = {
  reception: "/reception",
  doctor: "/doctor",
  admin: "/admin",
  store: "/store",
};

/**
 * Null if nobody is signed in, or the session belongs to a user with no
 * staff row. Wrapped in React's `cache()` so a layout and a page (or several
 * Server Actions) calling this in the same request share one lookup instead
 * of each re-hitting Supabase Auth and the `staff` table.
 */
export const getCurrentStaff = cache(async (): Promise<CurrentStaff | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: staff } = await supabase
    .from("staff")
    .select("id, full_name, email, role")
    .eq("id", user.id)
    .maybeSingle();
  if (!staff) return null;

  return { id: staff.id, fullName: staff.full_name, email: staff.email, role: staff.role };
});

/** Use at the top of any Server Action or page that requires a signed-in staff member, of any role. */
export async function requireStaff(): Promise<CurrentStaff> {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/staff/login");
  return staff;
}

/** Use at the top of any Server Action or page that requires one specific role (or one of a few). */
export async function requireRole(role: StaffRole | StaffRole[]): Promise<CurrentStaff> {
  const staff = await requireStaff();
  const allowed = Array.isArray(role) ? role : [role];
  if (!allowed.includes(staff.role)) redirect(ROLE_HOME[staff.role]);
  return staff;
}
