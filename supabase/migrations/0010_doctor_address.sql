-- Clinic address, shown on the printable prescription header alongside the
-- rest of the doctor's profile.

alter table public.doctor_profile add column address text not null default '';
