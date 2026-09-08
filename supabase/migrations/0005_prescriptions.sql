-- Prescription writing, gated by a feature flag until the "store" portal
-- (pharmacy fulfillment, its own staff login) exists to consume these rows.
-- staff_role will need a 'store' value added when that portal is built --
-- deliberately not added yet since nothing would use it. For now any staff
-- can read/write; that policy narrows once the store role exists.

alter table public.doctor_profile add column feat_prescriptions boolean not null default true;

create table public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  content text not null,
  dispensed boolean not null default false,
  created_at timestamptz not null default now()
);

create index prescriptions_booking_id_idx on public.prescriptions (booking_id);

alter table public.prescriptions enable row level security;

create policy "staff can manage prescriptions" on public.prescriptions
  for all using (public.current_staff_role() is not null);
