export function LocationDatePicker({
  locations,
  locationId,
  date,
  tab,
}: {
  locations: { id: string; name: string; area: string }[];
  locationId: string;
  date: string;
  tab?: string;
}) {
  return (
    <form method="get" className="mb-3 flex gap-2">
      {tab ? <input type="hidden" name="tab" value={tab} /> : null}
      <select
        name="locationId"
        defaultValue={locationId}
        className="h-9 flex-1 border border-divider bg-surface px-2 text-[13px] font-bold"
      >
        {locations.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name} — {l.area}
          </option>
        ))}
      </select>
      <input
        type="date"
        name="date"
        defaultValue={date}
        className="h-9 border border-divider bg-surface px-2 text-[13px] font-bold"
      />
      <button type="submit" className="h-9 cursor-pointer border border-ink px-3 text-[11px] font-extrabold uppercase">
        Go
      </button>
    </form>
  );
}
