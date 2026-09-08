-- Room-calling queue state, layered on top of the existing `checked_in`
-- boolean (arrival + payment flow, unchanged). A confirmed booking moves
-- waiting -> checked_in -> in_room -> done as reception checks a patient in
-- at the desk and then calls them into the doctor's room. At most one
-- booking can be 'in_room' per location/date at a time -- that row is the
-- single source of truth for "who's with the doctor right now", read by
-- the doctor dashboard and (later) a public queue-call display, both via
-- lib/data/queue.ts / app/api/now-serving -- neither exists yet, but this
-- is the table they'll both read from, so no rework when they're built.

create type public.queue_status as enum ('waiting', 'checked_in', 'in_room', 'done');

alter table public.bookings add column queue_status public.queue_status not null default 'waiting';

update public.bookings set queue_status = 'checked_in' where checked_in = true;

-- Enforced in the database, not just in application code, so a race between
-- two reception clicks can't seat two patients in the room at once.
create unique index bookings_one_in_room_per_session
  on public.bookings (location_id, visit_date)
  where queue_status = 'in_room';
