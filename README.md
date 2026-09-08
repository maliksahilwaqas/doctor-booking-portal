# Doctor Booking Portal

A single-doctor appointment-booking system: patients pick a location, day and
token; reception runs the queue and confirms requests; the doctor manages
their own schedule, patients and earnings; a platform admin configures the
deployment before handover. Built from a Claude Design mockup
(`Doctor Booking.dc.html`) and follows the same stack/conventions as the
sibling `court-booking-portal` project.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind v4 · Supabase (`@supabase/ssr`,
Postgres, RLS) · Zod · Vitest.

## Setup

1. `npm install`
2. Create a Supabase project, then run the SQL in `supabase/migrations/` (in
   order) followed by `supabase/seed.sql` -- via the SQL editor, or the
   Supabase CLI once linked.
3. Copy `.env.example` to `.env.local` and fill in your project's URL and
   anon key (and the service-role key, if you end up needing the admin
   client).
4. Create the four staff logins in Supabase Auth (dashboard -> Authentication
   -> Add user), then insert a matching row into `public.staff` for each,
   e.g.:
   ```sql
   insert into public.staff (id, full_name, email, role)
   values ('<auth-user-uuid>', 'Reception', 'reception@example.com', 'reception');
   ```
   Repeat with `role = 'doctor'`, `role = 'admin'` and `role = 'store'`.
   There's no in-app way to create staff accounts (the mockup doesn't have
   one either -- this is a one-time setup step).
5. `npm run dev`, then:
   - `/` -- patient booking (public)
   - `/staff/login` -- reception, doctor, admin and store all sign in here
     and are routed to `/reception`, `/doctor`, `/admin`, `/store` by role.
   - `/display` -- waiting-room token screen (public, see below)

## Store & prescriptions

The doctor writes a structured prescription (medicine + morning/night dose
checkboxes, a free-text note, an optional 15/30/60-day follow-up) from their
Dashboard tab while a patient is `in_room` -- gated by Admin > Switches'
"Prescription writing" flag. Once that patient is marked `done`, their
prescription (if it has at least one medicine) shows up same-day on the
**store** console (`/store`), which can mark it given and print it -- the
printable layout (`components/store/PrescriptionDocument.tsx`) pulls the
doctor's name/speciality/qualifications/phone/address/clinic straight from
the admin-edited `doctor_profile` row, so re-branding this app for a
different doctor is just editing that profile, not the print layout.
Reception also has a same-data "Follow-ups" list (Patients tab -> Follow up)
for the patients who got a follow-up date, soonest first.

## Token display

`/display` is a public, unauthenticated, chrome-free page meant to run
full-screen on a waiting-room TV or monitor -- point one at each location with
`?locationId=<id>` (falls back to whichever location is open today if
omitted). It polls the same `/api/now-serving` route the reception queue and
doctor dashboard already use, every 30 seconds, and shows only whichever token
is currently `in_room` as `T<n>` in giant centered text (an em-dash when no
one's in the room). It blinks for 45 seconds after the number it's showing
changes, so a call is hard to miss even if no one's looking right when it
happens. No new backend was needed for this -- it's a thin client on top of
the existing queue state.

## Deliberate deviations from the mockup

The mockup is a design prototype with some UI-only affordances and demo data
that don't map onto real, persisted state. These were intentionally not
faithfully reproduced as fake interactivity:

- **"BLOCK A DAY" / "BLOCK A SINGLE DAY" / "PUBLISH CHANGES" / "AUDIT LOG" /
  "MONTHLY STATEMENT"** buttons are inert in the mockup itself (no `onClick`)
  and stay inert here too.
- **Overbook per session** (Admin > Branding) is stored and displayed but not
  enforced -- the mockup never wired it to any booking logic either.
- **Earnings** are computed from real `bookings` rows for the current month,
  not the mockup's hardcoded "PKR 1.34M" flavor text -- a fresh deployment's
  numbers will look much smaller until real bookings accumulate.
- **Photo uploads** (Admin > Profile) are decorative, matching the mockup
  (its "REPLACE"/"MANAGE" buttons have no `onClick` either).
- **Session = "Both"** in the doctor's Settings editor is a mockup quirk: the
  UI offers it, but saving always collapses it to "Morning" (the schema only
  models one session per location). Reproduced as-is rather than "fixed",
  since multi-session locations aren't otherwise supported anywhere in the
  design.
