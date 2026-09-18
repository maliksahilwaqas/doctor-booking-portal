import { doseLabel, followUpLabel } from "@/lib/calc/prescription";
import { CLINIC_TIME_ZONE } from "@/lib/calc/timezone";
import type { PrescriptionItem } from "@/types/database.types";

export interface DoctorHeader {
  name: string;
  speciality: string;
  quals: string;
  phone: string;
  address: string;
  clinicName: string;
}

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatIssuedAt(iso: string): string {
  return new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: CLINIC_TIME_ZONE });
}

/**
 * The one prescription layout every deployment of this app prints from --
 * everything in the header comes from the admin panel's doctor profile
 * (see actions/admin.ts's updateProfile), so re-branding this for a
 * different doctor is just editing that profile, not this component.
 */
export function PrescriptionDocument({
  doctor,
  patientName,
  patientPhone,
  tokenNumber,
  visitDate,
  items,
  notes,
  followUpDays,
  issuedAt,
}: {
  doctor: DoctorHeader;
  patientName: string;
  patientPhone: string;
  tokenNumber: number;
  visitDate: string;
  items: PrescriptionItem[];
  notes: string;
  followUpDays: number | null;
  issuedAt: string;
}) {
  const followUp = followUpLabel(followUpDays);

  return (
    <div className="bg-white px-8 py-8 text-black" style={{ fontFamily: "var(--font-sans, sans-serif)" }}>
      <div className="border-b-2 border-black pb-4">
        <div className="text-[22px] font-extrabold leading-tight">{doctor.name}</div>
        <div className="mt-0.5 text-[13px] font-bold">
          {doctor.speciality} · {doctor.quals}
        </div>
        <div className="mt-1.5 text-[12px] leading-snug text-black/70">
          {doctor.clinicName}
          {doctor.address ? ` — ${doctor.address}` : ""}
        </div>
        <div className="text-[12px] text-black/70">{doctor.phone}</div>
      </div>

      <div className="mt-4 flex justify-between gap-4 border-b border-black/30 pb-4 text-[13px]">
        <div>
          <div className="font-extrabold">{patientName}</div>
          <div className="text-black/70">{patientPhone}</div>
        </div>
        <div className="text-right">
          <div className="font-bold">{formatDate(visitDate)}</div>
          <div className="text-black/70">Token {tokenNumber}</div>
        </div>
      </div>

      <table className="mt-5 w-full border-collapse text-[13px]">
        <thead>
          <tr>
            <th className="border-b-2 border-black pb-1.5 text-left text-[10px] font-extrabold uppercase tracking-[0.08em]">
              Medicine
            </th>
            <th className="border-b-2 border-black pb-1.5 text-left text-[10px] font-extrabold uppercase tracking-[0.08em]">
              Dosage
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i}>
              <td className="border-b border-black/20 py-2 pr-4 font-bold">{item.name}</td>
              <td className="border-b border-black/20 py-2">{doseLabel(item)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {notes ? (
        <div className="mt-5">
          <div className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-black/60">Note</div>
          <div className="mt-1 text-[13px] leading-relaxed whitespace-pre-wrap">{notes}</div>
        </div>
      ) : null}

      {followUp ? (
        <div className="mt-5 border-2 border-black px-3 py-2.5 text-[14px] font-extrabold">{followUp}</div>
      ) : null}

      <div className="mt-8 text-[10.5px] text-black/50">Issued {formatIssuedAt(issuedAt)}</div>
    </div>
  );
}
