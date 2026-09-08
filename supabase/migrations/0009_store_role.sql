-- The store portal (its own staff login, prints prescriptions and marks
-- them dispensed) gets its own role. No RLS changes needed -- the existing
-- "staff can manage prescriptions" / "staff can read all bookings"
-- policies already check `current_staff_role() is not null`, which covers
-- any staff role including this new one.

alter type public.staff_role add value 'store';
