-- Locations are the doctor's sitting sessions (a hospital/clinic/own
-- practice, one session a day, Mon-Sun availability). Token math (how many
-- tokens a session has, and each one's time) is derived from from_min/to_min
-- and slot_min -- see lib/calc/tokens.ts -- not stored.

create type public.session_name as enum ('morning', 'evening');

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  area text not null default '',
  session public.session_name not null,
  days integer[] not null default '{1,2,3,4,5,6}', -- 1=Mon..7=Sun
  from_min integer not null check (from_min >= 0 and from_min < 1440),
  to_min integer not null check (to_min > from_min and to_min <= 1440),
  slot_min integer not null check (slot_min > 0),
  fee numeric(10, 2) not null check (fee >= 0),
  follow_up_fee numeric(10, 2) not null check (follow_up_fee >= 0),
  detail text not null default '',
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.locations enable row level security;

create policy "anyone can read active locations" on public.locations
  for select using (active or public.current_staff_role() is not null);

-- Both the doctor (editing their own hours from Settings) and the admin
-- (full location management) can write here; which fields each is allowed
-- to touch is enforced in actions/doctor.ts and actions/admin.ts, not RLS --
-- same "defense in depth at the action layer" approach used for the
-- doctor-settings visibility feature flag.
create policy "staff can manage locations" on public.locations
  for all using (public.current_staff_role() is not null);
