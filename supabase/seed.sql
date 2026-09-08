-- Demo data matching the Claude Design mockup (Doctor Booking.dc.html) so a
-- freshly-seeded deployment looks the same as the design.

update public.doctor_profile set
  name = 'Dr. Ayesha Rahim',
  speciality = 'Consultant Cardiologist',
  quals = 'MBBS (Dow), FCPS Cardiology',
  phone = '+92 21 111 4357',
  clinic_name = 'Rahim Cardiology'
where id = true;

insert into public.locations (name, area, session, days, from_min, to_min, slot_min, fee, follow_up_fee, detail, sort_order) values
  ('Shifa Hospital', 'Clifton', 'morning', '{1,2,3,4,5,6}', 540, 720, 5, 3000, 1500,
   'Mon-Sat mornings, 09:00-12:00. Block C, second floor. Parking on site.', 0),
  ('Aga Clinic', 'Gulshan', 'morning', '{2,4}', 600, 720, 10, 2500, 1200,
   'Tue and Thu mornings, 10:00-12:00. Ground floor, gate 2.', 1),
  ('Rahim Medical', 'own practice', 'evening', '{1,2,3,4,5}', 1080, 1260, 10, 3500, 1800,
   'Evenings only, 18:00-21:00. Own practice, 10 min tokens.', 2);

-- A day's worth of demo bookings against Shifa Hospital, dated today, so the
-- reception queue / doctor patient list have something to show. Tokens 1-29
-- (minus a few gaps) mirror the mockup's `taken` list for that location.
with shifa as (select id from public.locations where name = 'Shifa Hospital' limit 1)
insert into public.bookings (location_id, visit_date, token_number, status, patient_name, patient_phone, is_follow_up, fee, checked_in, paid)
select shifa.id, current_date, n, 'confirmed', 'Demo patient ' || n, '0300 000 ' || lpad(n::text, 4, '0'), false, 3000, n <= 12, n <= 12
from shifa, unnest(array[1,2,3,5,6,8,9,11,12,14,15,17,18,19,21,22,24,25,26,27,28,29]) as n;

with shifa as (select id from public.locations where name = 'Shifa Hospital' limit 1)
update public.bookings set patient_name = 'Hamza Khan', checked_in = true
from shifa where bookings.location_id = shifa.id and token_number = 12;

with shifa as (select id from public.locations where name = 'Shifa Hospital' limit 1)
update public.bookings set patient_name = 'Zara Malik', patient_phone = '0300 214 8890', is_follow_up = true, fee = 1500
from shifa where bookings.location_id = shifa.id and token_number = 13;

with shifa as (select id from public.locations where name = 'Shifa Hospital' limit 1)
update public.bookings set patient_name = 'Ali Raza', patient_phone = '0321 447 1206'
from shifa where bookings.location_id = shifa.id and token_number = 14;

with shifa as (select id from public.locations where name = 'Shifa Hospital' limit 1)
update public.bookings set patient_name = 'Sana Farooq', patient_phone = '0333 902 5514', is_follow_up = true, fee = 1500
from shifa where bookings.location_id = shifa.id and token_number = 15;

with shifa as (select id from public.locations where name = 'Shifa Hospital' limit 1)
update public.bookings set patient_name = 'Bilal Aziz', patient_phone = '0345 118 7742', paid = true, fee = 0
from shifa where bookings.location_id = shifa.id and token_number = 16;

-- One pending request, tomorrow, at the same location -- shows up in
-- Reception's Requests tab and awaits confirm/decline.
with shifa as (select id from public.locations where name = 'Shifa Hospital' limit 1)
insert into public.bookings (location_id, visit_date, token_number, status, patient_name, patient_phone, fee)
select shifa.id, current_date + 2, 30, 'pending', 'Nadia Aslam', '0301 556 7783', 3000
from shifa;
