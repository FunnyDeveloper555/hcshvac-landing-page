import jsPDF from "jspdf";
import { supabase } from "@/integrations/supabase/client";
import type { SystemKind } from "@/components/admin/siteprofile/SystemCard";

type Dict = Record<string, any>;

const KIND_LABEL: Record<string, string> = {
  heating: "Heating System",
  cooling: "Cooling System",
  sump_pump: "Sump Pump",
  ejector_pump: "Ejector Pump",
  water_heater: "Water Heater",
};

const SYSTEM_FIELDS: Record<string, [string, string][]> = {
  heating: [
    ["type", "Type"], ["brand", "Brand"], ["model_number", "Model #"], ["serial_number", "Serial #"],
    ["poise", "Poise"], ["width", "Width"], ["afue", "AFUE"], ["stage", "Stage"],
    ["energy_supply", "Energy Supply"], ["voltage", "Voltage"], ["btu_kw", "BTU / KW"],
    ["age", "Age"], ["thermostat", "Thermostat"],
  ],
  cooling: [
    ["brand", "Brand"], ["model_number", "Model #"], ["serial_number", "Serial #"], ["age", "Age"],
    ["location", "Location"], ["access", "Access"], ["mounting", "Mounting"], ["voltage", "Voltage"],
  ],
  sump_pump: [
    ["brand", "Brand"], ["model_number", "Model #"], ["hp", "HP"], ["pipe_size", "Pipe Size"],
    ["age", "Age"], ["voltage", "Voltage"],
  ],
  ejector_pump: [
    ["brand", "Brand"], ["model_number", "Model #"], ["hp", "HP"], ["pipe_size", "Pipe Size"],
    ["age", "Age"], ["voltage", "Voltage"],
  ],
  water_heater: [
    ["type", "Type"], ["brand", "Brand"], ["model_number", "Model #"], ["serial_number", "Serial #"],
    ["capacity", "Capacity"], ["energy_supply", "Energy Supply"], ["voltage", "Voltage"],
    ["btu_kw", "BTU / KW"], ["venting", "Venting"], ["location", "Location"], ["age", "Age"],
    ["expansion_tank", "Expansion Tank"], ["recirc_pump", "Recirculation Pump"], ["drip_pan", "Drip Pan"],
  ],
};

const ADDRESS_FIELDS: [string, string][] = [
  ["name", "Contact Name"], ["business_name", "Business Name"], ["address", "Address"],
  ["suite_number", "Suite / Unit"], ["city", "City"], ["state", "State"], ["zip", "Zip"],
  ["phone", "Phone"], ["email", "Email"],
];

const dash = (v: any) => {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v);
};

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export interface SiteProfilePdfInput {
  profile: Dict;
  systems: { id: string; kind: SystemKind; index: number; data: Dict }[];
  completedByName?: string;
  companyName?: string;
  assignedToName?: string;
  includePhotos?: boolean;
}

export async function buildSiteProfilePdf({
  profile,
  systems,
  completedByName,
  companyName,
  assignedToName,
  includePhotos = true,
}: SiteProfilePdfInput): Promise<jsPDF> {
  const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const M = 40;
  const contentW = pageW - M * 2;
  let y = M;

  const ensure = (needed: number) => {
    if (y + needed > pageH - M) {
      pdf.addPage();
      y = M;
    }
  };

  const sectionTitle = (text: string) => {
    ensure(34);
    pdf.setFillColor(243, 244, 246);
    pdf.rect(M, y, contentW, 20, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10.5);
    pdf.setTextColor(17, 24, 39);
    pdf.text(text, M + 8, y + 14);
    y += 28;
  };

  // Two-column label/value rows with fixed label column => perfect alignment
  const colW = contentW / 2;
  const labelW = 108;

  const drawPair = (label: string, value: string, x: number, rowY: number) => {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);
    pdf.setTextColor(107, 114, 128);
    pdf.text(label, x, rowY);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(17, 24, 39);
    const lines = pdf.splitTextToSize(value, colW - labelW - 12);
    pdf.text(lines, x + labelW, rowY);
    return Math.max(1, lines.length);
  };

  const fieldGrid = (pairs: [string, string][]) => {
    for (let i = 0; i < pairs.length; i += 2) {
      const left = pairs[i];
      const right = pairs[i + 1];
      ensure(20);
      const rowY = y + 9;
      const l1 = drawPair(left[0], left[1], M, rowY);
      const l2 = right ? drawPair(right[0], right[1], M + colW, rowY) : 1;
      const h = Math.max(l1, l2) * 11 + 6;
      pdf.setDrawColor(233, 236, 239);
      pdf.line(M, y + h, M + contentW, y + h);
      y += h + 2;
    }
    y += 6;
  };

  const paragraph = (text: string) => {
    const lines = pdf.splitTextToSize(text || "—", contentW);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(17, 24, 39);
    for (const line of lines) {
      ensure(14);
      pdf.text(line, M, y + 9);
      y += 12;
    }
    y += 8;
  };

  // ---- Header
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.setTextColor(17, 24, 39);
  pdf.text("Site Location Profile", M, y + 12);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(107, 114, 128);
  const headerRight = [companyName || "", new Date().toLocaleString()].filter(Boolean);
  headerRight.forEach((t, i) => pdf.text(t, pageW - M, y + 4 + i * 12, { align: "right" }));
  y += 26;
  pdf.setDrawColor(220, 70, 70);
  pdf.setLineWidth(1.5);
  pdf.line(M, y, pageW - M, y);
  pdf.setLineWidth(0.5);
  y += 16;

  // ---- Report header
  sectionTitle("Report Header");
  fieldGrid([
    ["Report Number", dash(profile.report_number)],
    ["Session ID", dash(profile.session_id)],
    ["Completed By", dash(completedByName)],
    ["Job Number", dash(profile.job_number)],
    ["Assigned Company", dash(companyName)],
    ["Assigned To", dash(assignedToName)],
    ["Booking Method", dash(profile.booking_method)],
    ["Location Type", dash(profile.location_type ? titleCase(profile.location_type) : "")],
    ["MDU (Multi-Dwelling)", profile.mdu ? "Yes" : "No"],
    ["Unit Label", dash(profile.unit_label)],
    ["Visit Type", dash(profile.visit_type)],
    ["Equipment Type", dash(profile.equipment_type)],
    ["Equipment Location", dash(profile.equipment_location)],
    ["Ticket Status", dash(profile.ticket_status)],
    ["Customer Deemed Status", dash(profile.customer_deemed_status)],
    ["Profile Status", dash(profile.status ? titleCase(profile.status) : "")],
  ]);

  // ---- Addresses
  for (const [key, title] of [["ship_to", "Ship To"], ["bill_to", "Bill To"]] as const) {
    const src: Dict = profile[key] || {};
    sectionTitle(title);
    fieldGrid(ADDRESS_FIELDS.map(([k, l]) => [l, dash(src[k])] as [string, string]));
  }

  // ---- Contacts
  const pc: Dict = profile.primary_contact || {};
  const sc: Dict = profile.secondary_contact || {};
  if (Object.values(pc).some(Boolean) || Object.values(sc).some(Boolean)) {
    sectionTitle("Contacts");
    fieldGrid([
      ["Primary Name", dash(pc.name)],
      ["Primary Phone", dash(pc.phone)],
      ["Primary Email", dash(pc.email)],
      ["Secondary Name", dash(sc.name)],
      ["Secondary Phone", dash(sc.phone)],
      ["Secondary Email", dash(sc.email)],
    ]);
  }

  // ---- Photos lookup
  let photosBySystem: Record<string, { label: string; url: string }[]> = {};
  if (includePhotos && profile.id) {
    const { data: photoRows } = await supabase
      .from("site_profile_photos")
      .select("*")
      .eq("profile_id", profile.id)
      .order("created_at", { ascending: true });
    for (const r of photoRows || []) {
      const { data: s } = await supabase.storage
        .from("site-profile-photos")
        .createSignedUrl((r as any).storage_path, 3600);
      if (!s?.signedUrl) continue;
      const dataUrl = await toDataUrl(s.signedUrl);
      if (!dataUrl) continue;
      const key = (r as any).system_id || "profile";
      const label =
        (r as any).slot_title ||
        String((r as any).component_slot || "")
          .split("_")
          .map(titleCase)
          .join(" ");
      photosBySystem[key] = photosBySystem[key] || [];
      photosBySystem[key].push({ label, url: dataUrl });
    }
  }

  // ---- Systems
  sectionTitle("Systems on Site");
  if (systems.length === 0) {
    paragraph("No systems recorded.");
  }
  for (const s of systems) {
    ensure(30);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(220, 70, 70);
    pdf.text(`${KIND_LABEL[s.kind] || s.kind} #${s.index}`, M, y + 10);
    y += 20;
    const fields = SYSTEM_FIELDS[s.kind] || [];
    const filterFields: [string, string][] = [
      ["filter_quantity", "Filter Quantity"],
      ["filter_equipment_id", "Unit / Equipment ID Tag #"],
      ["filter_notes", "Filter Notes / Comments"],
    ];
    const beltFields: [string, string][] = [
      ["belt_equipment_id", "Belt Unit / Equipment ID Tag #"],
      ["belt_notes", "Belt Notes / Comments"],
    ];
    const fieldDocsFields: [string, string][] = [
      ["field_documents_equipment_id", "Field Documents Unit / Equipment ID Tag #"],
      ["field_documents_notes", "Field Documents Notes / Comments"],
    ];
    fieldGrid([...fields, ...filterFields, ...beltFields, ...fieldDocsFields].map(([k, l]) => [l, dash((s.data || {})[k])] as [string, string]));
    const notes = (s.data || {}).notes;
    if (notes) {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);
      pdf.setTextColor(107, 114, 128);
      ensure(16);
      pdf.text("Notes / Observations", M, y + 8);
      y += 14;
      paragraph(String(notes));
    }
    const photos = photosBySystem[s.id] || [];
    if (photos.length) {
      drawPhotoGrid(pdf, photos, { M, contentW, pageH, get: () => y, set: (v) => (y = v) });
    }
  }

  // ---- General notes
  sectionTitle("General Notes");
  paragraph(profile.notes || "—");

  // Page numbers
  const total = pdf.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    pdf.setPage(i);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(`Page ${i} of ${total}`, pageW - M, pageH - 18, { align: "right" });
    if (profile.report_number) pdf.text(String(profile.report_number), M, pageH - 18);
  }

  return pdf;
}

function drawPhotoGrid(
  pdf: jsPDF,
  photos: { label: string; url: string }[],
  ctx: { M: number; contentW: number; pageH: number; get: () => number; set: (v: number) => void }
) {
  const cols = 3;
  const gap = 10;
  const cellW = (ctx.contentW - gap * (cols - 1)) / cols;
  const imgH = cellW * 0.72;
  const cellH = imgH + 16;
  for (let i = 0; i < photos.length; i += cols) {
    let y = ctx.get();
    if (y + cellH > ctx.pageH - 40) {
      pdf.addPage();
      y = 40;
    }
    const row = photos.slice(i, i + cols);
    row.forEach((p, c) => {
      const x = ctx.M + c * (cellW + gap);
      try {
        pdf.addImage(p.url, "JPEG", x, y, cellW, imgH);
      } catch {
        pdf.setDrawColor(220, 220, 220);
        pdf.rect(x, y, cellW, imgH);
      }
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.5);
      pdf.setTextColor(107, 114, 128);
      const lines = pdf.splitTextToSize(p.label, cellW);
      pdf.text(lines.slice(0, 1), x, y + imgH + 9);
    });
    ctx.set(y + cellH + 6);
  }
  ctx.set(ctx.get() + 4);
}

// Downscale + re-encode photos so the resulting PDF stays small enough to email.
async function toDataUrl(url: string, maxDim = 700, quality = 0.6): Promise<string | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const bitmap = await createImageBitmap(blob);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    return canvas.toDataURL("image/jpeg", quality);
  } catch {
    return null;
  }
}
