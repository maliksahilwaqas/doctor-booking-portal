import type { SessionLabelStyle, SessionName } from "@/types/database.types";

const LABELS: Record<SessionLabelStyle, Record<SessionName, string>> = {
  morning_evening: { morning: "Morning", evening: "Evening" },
  am_pm: { morning: "AM", evening: "PM" },
  numbered: { morning: "Session 1", evening: "Session 2" },
};

export function sessionLabel(style: SessionLabelStyle, session: SessionName): string {
  return LABELS[style][session];
}
