"use client";

import { useRouter } from "next/navigation";
import { sessionLabel } from "@/lib/calc/labels";
import { formatTime } from "@/lib/calc/format";
import type { SessionLabelStyle, SessionName } from "@/types/database.types";

interface LocationOption {
  id: string;
  name: string;
  area: string;
  session: SessionName;
  fromMin: number;
  toMin: number;
}

function groupKey(l: LocationOption): string {
  return JSON.stringify([l.name, l.area]);
}

/**
 * Replaces the old location+date picker on the Queue and Patients tabs.
 * A doctor can sit at the same physical place more than once a day (two
 * `locations` rows sharing a name+area but different session/hours) -- the
 * old plain location dropdown listed those as two identically-labeled
 * entries. This groups by name+area and only shows a second "time" select
 * when a place actually has more than one sitting.
 *
 * `date` is only passed (and only then does a date input render) for the
 * Patients tab -- the Queue tab has no date control at all, it's always
 * today. Every change navigates immediately; there's no separate Go button.
 */
export function LocationSessionPicker({
  locations,
  currentLocationId,
  tab,
  sessionLabelStyle,
  date,
}: {
  locations: LocationOption[];
  currentLocationId: string;
  tab: string;
  sessionLabelStyle: SessionLabelStyle;
  date?: string;
}) {
  const router = useRouter();

  const groupsByKey = new Map<string, LocationOption[]>();
  for (const l of locations) {
    const key = groupKey(l);
    const arr = groupsByKey.get(key);
    if (arr) arr.push(l);
    else groupsByKey.set(key, [l]);
  }
  const groups = [...groupsByKey.entries()].map(([key, variants]) => ({
    key,
    variants: variants.slice().sort((a, b) => a.fromMin - b.fromMin),
  }));

  const currentLoc = locations.find((l) => l.id === currentLocationId) ?? locations[0] ?? null;
  const currentKey = currentLoc ? groupKey(currentLoc) : undefined;
  const currentGroup = groups.find((g) => g.key === currentKey) ?? groups[0] ?? null;

  function navigate(locationId: string, nextDate?: string) {
    const params = new URLSearchParams({ tab, locationId });
    if (nextDate) params.set("date", nextDate);
    router.push(`/reception?${params.toString()}`);
  }

  if (!currentLoc || !currentGroup) return null;

  return (
    <div className="mb-3 flex flex-wrap gap-2">
      <select
        value={currentGroup.key}
        onChange={(e) => {
          const g = groups.find((x) => x.key === e.target.value);
          const first = g?.variants[0];
          if (first) navigate(first.id, date);
        }}
        className="h-9 min-w-0 flex-1 border border-divider bg-surface px-2 text-[13px] font-bold"
      >
        {groups.map((g) => (
          <option key={g.key} value={g.key}>
            {g.variants[0].name} — {g.variants[0].area}
          </option>
        ))}
      </select>

      {currentGroup.variants.length > 1 ? (
        <select
          value={currentLoc.id}
          onChange={(e) => navigate(e.target.value, date)}
          className="h-9 min-w-0 flex-1 border border-divider bg-surface px-2 text-[13px] font-bold"
        >
          {currentGroup.variants.map((v) => (
            <option key={v.id} value={v.id}>
              {sessionLabel(sessionLabelStyle, v.session)} · {formatTime(v.fromMin)}–{formatTime(v.toMin)}
            </option>
          ))}
        </select>
      ) : null}

      {date !== undefined ? (
        <input
          type="date"
          defaultValue={date}
          onChange={(e) => e.target.value && navigate(currentLoc.id, e.target.value)}
          className="h-9 w-[124px] flex-none border border-divider bg-surface px-2 text-[13px] font-bold"
        />
      ) : null}
    </div>
  );
}
