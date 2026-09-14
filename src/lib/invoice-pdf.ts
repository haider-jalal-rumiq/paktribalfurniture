/**
 * The invoice as a real PDF file, so it can be downloaded or handed to
 * WhatsApp. Drawn from the same `InvoiceLike` the printed document renders,
 * with the same brand and reference — the two must always agree.
 *
 * Client-only: jsPDF is imported dynamically so it never enters a server
 * bundle or the first-load JS of an invoice page.
 */
import { invoiceTotal, showDate } from "@/lib/accounting-core";
import { formatPkr } from "@/lib/money";
import type { Brand, InvoiceLike } from "@/components/cms/documents";

const MARGIN = 48;
const PAGE_WIDTH = 595.28; // A4 portrait, points
const PAGE_HEIGHT = 841.89;
const RIGHT = PAGE_WIDTH - MARGIN;
const INK = [20, 32, 28] as const;
const MUTED = [102, 116, 110] as const;
const ACCENT = [150, 59, 54] as const;
const HAIRLINE = [203, 210, 200] as const;

/** Column x positions: serial, item, qty (right), unit (right), total (right). */
const COL = { serial: MARGIN, item: MARGIN + 26, qty: MARGIN + 330, unit: MARGIN + 400, total: RIGHT };

// public/images/brand-mark.png, 537x523 — the same icon Document renders
// beside the brand lockup on screen and in print.
const LOGO_WIDTH = 34;
const LOGO_HEIGHT = LOGO_WIDTH * (523 / 537);
const LOGO_GAP = 10;

const rupees = (value: number | bigint) => formatPkr(value).replace(/^Rs /, "");

export function invoiceFileName(reference: string): string {
  return `${reference.replace(/[^A-Za-z0-9-]+/g, "-")}.pdf`;
}

/**
 * The brand mark as a small data URL jsPDF can embed. The source PNG is
 * 537x523 for crisp on-screen use; drawn onto a small canvas first so the
 * PDF embeds a couple of KB instead of the raw 842KB bitmap (jsPDF stores
 * addImage() pixels largely uncompressed). Null if it can't be loaded — the
 * PDF still builds, just without the icon.
 */
async function loadLogo(): Promise<string | null> {
  try {
    const response = await fetch("/images/brand-mark.png");
    if (!response.ok) return null;
    const bitmap = await createImageBitmap(await response.blob());
    const width = 160;
    const height = Math.round(width * (bitmap.height / bitmap.width));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, width, height);
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

export async function invoicePdfBlob(invoice: InvoiceLike, brand: Brand, reference: string): Promise<Blob> {
  const [{ jsPDF }, logo] = await Promise.all([import("jspdf"), loadLogo()]);
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  let y = MARGIN;
  const text = (value: string, x: number, options?: { align?: "right"; size?: number; bold?: boolean; color?: readonly number[] }) => {
    doc.setFontSize(options?.size ?? 10);
    doc.setFont("helvetica", options?.bold ? "bold" : "normal");
    const [r, g, b] = options?.color ?? INK;
    doc.setTextColor(r, g, b);
    doc.text(value, x, y, options?.align ? { align: options.align } : undefined);
  };
  const rule = () => {
    const [r, g, b] = HAIRLINE;
    doc.setDrawColor(r, g, b);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, y, RIGHT, y);
  };
  /** A new page whenever the next block would cross the bottom margin. */
  const room = (needed: number) => {
    if (y + needed <= PAGE_HEIGHT - MARGIN) return;
    doc.addPage();
    y = MARGIN;
  };

  // Header: logo mark + brand lockup left, document title right.
  if (logo) doc.addImage(logo, "PNG", MARGIN, MARGIN, LOGO_WIDTH, LOGO_HEIGHT);
  const brandX = logo ? MARGIN + LOGO_WIDTH + LOGO_GAP : MARGIN;
  const brandTop = logo ? MARGIN + (LOGO_HEIGHT - brand.lines.length * 16) / 2 + 12 : MARGIN + 14;
  brand.lines.forEach((line, index) => {
    y = brandTop + index * 16;
    text(line, brandX, { size: 14, bold: true });
  });
  y = MARGIN + 14;
  text(invoice.status === "void" ? "Voided invoice" : "Invoice", RIGHT, { align: "right", size: 20, bold: true, color: ACCENT });
  y += 18;
  text(reference, RIGHT, { align: "right", size: 10, bold: true });
  y = MARGIN + Math.max(LOGO_HEIGHT, 14 + brand.lines.length * 16) + 4;
  text(brand.phone, MARGIN, { size: 9, color: MUTED });

  y += 22;
  rule();

  // Parties.
  y += 20;
  text("BILL TO", MARGIN, { size: 8, bold: true, color: MUTED });
  text("INVOICE DATE", RIGHT, { align: "right", size: 8, bold: true, color: MUTED });
  y += 15;
  text(invoice.client_name, MARGIN, { size: 12, bold: true });
  text(showDate(invoice.issued_on), RIGHT, { align: "right" });
  if (invoice.client_address) {
    for (const line of doc.splitTextToSize(invoice.client_address, 300) as string[]) {
      y += 13;
      text(line, MARGIN, { size: 9, color: MUTED });
    }
  }
  if (invoice.client_phone) {
    y += 13;
    text(invoice.client_phone, MARGIN, { size: 9, color: MUTED });
  }

  // Items.
  y += 26;
  rule();
  y += 14;
  text("S.No.", COL.serial, { size: 8, bold: true, color: MUTED });
  text("ITEM", COL.item, { size: 8, bold: true, color: MUTED });
  text("QTY", COL.qty, { align: "right", size: 8, bold: true, color: MUTED });
  text("UNIT (Rs)", COL.unit, { align: "right", size: 8, bold: true, color: MUTED });
  text("TOTAL (Rs)", COL.total, { align: "right", size: 8, bold: true, color: MUTED });
  y += 6;
  rule();

  invoice.items.forEach((item, index) => {
    const name = doc.splitTextToSize(item.item, 280) as string[];
    const source = [item.code, item.source].filter(Boolean).join(" / ");
    room(name.length * 13 + (source ? 12 : 0) + 18);
    y += 16;
    const first = y;
    text(String(index + 1), COL.serial, { size: 9, color: MUTED });
    name.forEach((line, lineIndex) => {
      y = first + lineIndex * 12;
      text(line, COL.item);
    });
    if (source) {
      y += 12;
      text(source, COL.item, { size: 8, color: MUTED });
    }
    y = first;
    text(String(item.quantity), COL.qty, { align: "right" });
    text(rupees(item.amount), COL.unit, { align: "right" });
    text(rupees(BigInt(item.amount) * BigInt(item.quantity)), COL.total, { align: "right", bold: true });
    y = first + (name.length - 1) * 12 + (source ? 12 : 0) + 8;
    rule();
  });

  // Totals.
  const subtotal = invoiceTotal(invoice.items);
  const discountPct = invoice.discount_pct ?? 0;
  room(90);
  y += 20;
  const quantity = invoice.items.reduce((sum, item) => sum + item.quantity, 0);
  text(`${invoice.items.length} line items   -   Total quantity: ${quantity}`, MARGIN, { size: 9, color: MUTED });
  if (discountPct > 0) {
    text("Subtotal", COL.unit, { align: "right", size: 9, color: MUTED });
    text(formatPkr(subtotal), COL.total, { align: "right", size: 9, color: MUTED });
    y += 14;
    text(`Discount ${discountPct}%`, COL.unit, { align: "right", size: 9, color: MUTED });
    text(`- ${formatPkr(subtotal - BigInt(invoice.total_amount))}`, COL.total, { align: "right", size: 9, color: MUTED });
  }
  y += 22;
  rule();
  y += 20;
  text("Grand total", COL.unit, { align: "right", size: 12, bold: true });
  text(formatPkr(invoice.total_amount), COL.total, { align: "right", size: 12, bold: true, color: ACCENT });

  if (invoice.status === "void") {
    y += 24;
    text("Voided. Excluded from Total sales.", MARGIN, { size: 9, bold: true, color: ACCENT });
  }

  if (invoice.notes) {
    const notes = doc.splitTextToSize(invoice.notes, RIGHT - MARGIN) as string[];
    room(notes.length * 12 + 30);
    y += 30;
    text("NOTES", MARGIN, { size: 8, bold: true, color: MUTED });
    for (const line of notes) {
      y += 13;
      text(line, MARGIN, { size: 9, color: MUTED });
    }
  }

  // Footer on every page.
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    y = PAGE_HEIGHT - MARGIN + 16;
    text(brand.name, MARGIN, { size: 8, color: MUTED });
    text(reference, RIGHT, { align: "right", size: 8, color: MUTED });
  }

  return doc.output("blob");
}
