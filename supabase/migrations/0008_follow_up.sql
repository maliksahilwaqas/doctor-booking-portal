-- A follow-up interval the doctor sets when writing a prescription. The
-- actual follow-up date isn't stored -- it's derived from created_at +
-- follow_up_days wherever it's read (see lib/data/prescriptions.ts's
-- getUpcomingFollowUps), so there's one source of truth.

alter table public.prescriptions add column follow_up_days integer check (follow_up_days in (15, 30, 60));
