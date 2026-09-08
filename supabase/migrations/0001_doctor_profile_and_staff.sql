-- Single-doctor-per-deployment model: one `doctor_profile` row holds
-- identity, branding and the platform-admin "wording"/feature switches --
-- everything the Platform Admin screen edits before a deployment is handed
-- over to the doctor. `staff` holds the three roles (reception/doctor/admin)
-- that sign in through the shared /staff/login page.

create extension if not exists "pgcrypto";

create type public.accent_name as enum ('blue', 'teal', 'indigo', 'green', 'maroon');
create type public.session_label_style as enum ('morning_evening', 'am_pm', 'numbered');
create type public.location_term as enum ('hospital', 'clinic', 'branch');
create type public.currency_code as enum ('PKR', 'AED', 'USD');
create type public.staff_role as enum ('reception', 'doctor', 'admin');

create table public.doctor_profile (
  id boolean primary key default true constraint single_row check (id),
  name text not null default 'Dr. Ayesha Rahim',
  speciality text not null default 'Consultant Cardiologist',
  quals text not null default 'MBBS (Dow), FCPS Cardiology',
  phone text not null default '+92 21 111 4357',
  clinic_name text not null default 'Rahim Cardiology',

  accent public.accent_name not null default 'blue',
  session_labels public.session_label_style not null default 'morning_evening',
  location_term public.location_term not null default 'hospital',
  currency public.currency_code not null default 'PKR',
  booking_window_days integer not null default 45 check (booking_window_days > 0),
  overbook_per_session integer not null default 2 check (overbook_per_session >= 0),

  -- Slot lengths (minutes) the doctor is allowed to pick for a session --
  -- see the Switches tab. A location's own slot_min must be one of these.
  allowed_slot_minutes integer[] not null default '{5,10,15}',
  off_days integer[] not null default '{7}', -- 1=Mon..7=Sun, doctor-wide

  feat_pay boolean not null default true,
  feat_sms boolean not null default true,
  feat_video boolean not null default false,
  feat_cancel boolean not null default true,
  feat_doctor_settings boolean not null default true,
  feat_queue_screen boolean not null default false,

  updated_at timestamptz not null default now()
);

insert into public.doctor_profile (id) values (true);

create table public.staff (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null,
  role public.staff_role not null,
  created_at timestamptz not null default now()
);

alter table public.doctor_profile enable row level security;
alter table public.staff enable row level security;

create or replace function public.current_staff_role()
returns public.staff_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.staff where id = auth.uid();
$$;

-- Profile/branding is not sensitive -- the patient screen and the shared
-- layout (accent colour) both read it unauthenticated.
create policy "anyone can read doctor profile" on public.doctor_profile
  for select using (true);

create policy "admin can update doctor profile" on public.doctor_profile
  for update using (public.current_staff_role() = 'admin');

create policy "staff can read their own row" on public.staff
  for select using (auth.uid() = id or public.current_staff_role() = 'admin');
