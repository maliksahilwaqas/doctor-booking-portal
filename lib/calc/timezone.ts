/**
 * The clinic's own timezone. "Today", which day a visit belongs to, and the
 * time printed on a prescription all mean the clinic's wall clock -- not the
 * server's, and not UTC. Using UTC made a clinic five hours ahead of it
 * (Pakistan) think it was still yesterday until 05:00. One value per
 * deployment, like the currency; NEXT_PUBLIC_ so the browser (the patient
 * day picker, the waiting-room display) agrees with the server.
 */
export const CLINIC_TIME_ZONE = process.env.NEXT_PUBLIC_CLINIC_TIME_ZONE || "Asia/Karachi";

const dateFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: CLINIC_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** "YYYY-MM-DD" for an instant, as it reads on the clinic's own calendar. */
export function clinicDateISO(instant: Date = new Date()): string {
  return dateFormat.format(instant);
}
