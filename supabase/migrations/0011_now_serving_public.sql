-- The public waiting-room display (app/display) is unauthenticated by
-- design -- no staff login, just a URL pointed at a TV. The `bookings`
-- table only grants select to signed-in staff ("staff can read all
-- bookings" in 0003_bookings.sql), so an anonymous visitor could never
-- see who's in the room; the display silently showed the empty state
-- forever regardless of the real queue. Same fix as token_availability:
-- a narrow view exposing only the token number, nothing that identifies
-- the patient.

create view public.now_serving_public as
  select location_id, visit_date, token_number
  from public.bookings
  where status = 'confirmed' and queue_status = 'in_room';

grant select on public.now_serving_public to anon, authenticated;
