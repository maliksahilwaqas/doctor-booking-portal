-- Prescriptions become a structured medicine list (name + morning/night
-- dose checkboxes) instead of freeform text, so the future store portal can
-- render a real dispense checklist instead of parsing prose.

alter table public.prescriptions drop column content;
alter table public.prescriptions add column items jsonb not null default '[]'::jsonb;
