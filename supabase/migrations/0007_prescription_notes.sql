-- A free-text note alongside the structured medicine table, for anything
-- that doesn't fit name/morning/night (dosage details, follow-up instructions).

alter table public.prescriptions add column notes text not null default '';
