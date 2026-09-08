-- A patient's request is a booking row with status = 'pending'; reception
-- confirms or declines it. A walk-in is inserted by reception already
-- 'confirmed'. The exclusion constraint is the same double-booking guard as
-- court-booking-portal's `no_overlapping_bookings` -- here on the token
-- number instead of an hour range, since tokens (not time ranges) are the
-- unit patients pick.

create extension if not exists "btree_gist";

create type public.booking_status as enum ('pending', 'confirmed', 'declined', 'cancelled');

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations (id) on delete cascade,
  visit_date date not null,
  token_number integer not null check (token_number > 0),
  status public.booking_status not null default 'pending',
  patient_name text not null,
  patient_phone text not null,
  is_follow_up boolean not null default false,
  fee numeric(10, 2) not null check (fee >= 0),
  checked_in boolean not null default false,
  paid boolean not null default false,
  created_at timestamptz not null default now(),

  constraint no_double_booked_token
    exclude using gist (
      location_id with =,
      visit_date with =,
      token_number with =
    ) where (status in ('pending', 'confirmed'))
);

create index bookings_location_date_idx on public.bookings (location_id, visit_date);

alter table public.bookings enable row level security;

-- Anyone can request a booking, but only in the "just submitted" shape --
-- no check-in/payment recorded yet.
create policy "anyone can request a booking" on public.bookings
  for insert
  with check (status = 'pending' and checked_in = false and paid = false);

create policy "staff can insert bookings" on public.bookings
  for insert
  with check (public.current_staff_role() is not null);

create policy "staff can read all bookings" on public.bookings
  for select using (public.current_staff_role() is not null);

create policy "staff can update bookings" on public.bookings
  for update using (public.current_staff_role() is not null);

-- The public token picker needs to know which tokens are taken without
-- exposing the patient's name or phone number.
create view public.token_availability as
  select location_id, visit_date, token_number, status
  from public.bookings
  where status in ('pending', 'confirmed');

grant select on public.token_availability to anon, authenticated;
