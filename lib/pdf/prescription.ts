import { jsPDF } from "jspdf";
import { doseLabel, followUpLabel } from "@/lib/calc/prescription";
import { CLINIC_TIME_ZONE } from "@/lib/calc/timezone";
import type { PrescriptionItem } from "@/types/database.types";
import type { DoctorHeader } from "@/components/store/PrescriptionDocument";

export interface PrescriptionPdfData {
  doctor: DoctorHeader;
  patientName: string;
  patientPhone: string;
  tokenNumber: number;
  visitDate: string;
  items: PrescriptionItem[];
  notes: string;
  followUpDays: number | null;
  issuedAt: string;
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
 * Draws the same content as components/store/PrescriptionDocument.tsx, but
 * as real vector text on an A4 page (not a screenshot of the DOM) -- so the
 * shared/downloaded PDF is crisp and small regardless of screen zoom or
 * device pixel ratio. Keep this in sync with that component if the layout
 * changes.
 */
export function buildPrescriptionPdf(data: PrescriptionPdfData): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = 210;
  const marginX = 20;
  const contentWidth = pageWidth - marginX * 2;
  let y = 22;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(0);
  doc.text(data.doctor.name, marginX, y);
  y += 7;

  doc.setFontSize(11);
  doc.text(`${data.doctor.speciality} · ${data.doctor.quals}`, marginX, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90);
  const clinicLine = data.doctor.address ? `${data.doctor.clinicName} — ${data.doctor.address}` : data.doctor.clinicName;
  doc.text(clinicLine, marginX, y);
  y += 5;
  doc.text(data.doctor.phone, marginX, y);
  y += 5;

  doc.setDrawColor(0);
  doc.setLineWidth(0.6);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 9;

  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(data.patientName, marginX, y);
  doc.text(formatDate(data.visitDate), pageWidth - marginX, y, { align: "right" });
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90);
  doc.text(data.patientPhone, marginX, y);
  doc.text(`Token ${data.tokenNumber}`, pageWidth - marginX, y, { align: "right" });
  y += 5;

  doc.setDrawColor(180);
  doc.setLineWidth(0.3);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 9;

  const doseColumnX = marginX + contentWidth * 0.58;
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("MEDICINE", marginX, y);
  doc.text("DOSAGE", doseColumnX, y);
  y += 2;
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 6;

  doc.setFontSize(11);
  for (const item of data.items) {
    doc.setFont("helvetica", "bold");
    doc.text(item.name, marginX, y);
    doc.setFont("helvetica", "normal");
    doc.text(doseLabel(item), doseColumnX, y);
    y += 3;
    doc.setDrawColor(220);
    doc.setLineWidth(0.2);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 6;
  }
  y += 3;

  if (data.notes) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text("NOTE", marginX, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(0);
    const noteLines: string[] = doc.splitTextToSize(data.notes, contentWidth);
    doc.text(noteLines, marginX, y);
    y += noteLines.length * 5 + 5;
  }

  const followUp = followUpLabel(data.followUpDays);
  if (followUp) {
    doc.setDrawColor(0);
    doc.setLineWidth(0.6);
    doc.rect(marginX, y, contentWidth, 12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(followUp, marginX + 4, y + 8);
    y += 18;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Issued ${formatIssuedAt(data.issuedAt)}`, marginX, 283);

  return doc;
}
