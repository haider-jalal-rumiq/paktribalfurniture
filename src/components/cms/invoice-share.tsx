"use client";

import { useState } from "react";
import { Download, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Brand, InvoiceLike } from "@/components/cms/documents";
import { invoiceFileName, invoicePdfBlob } from "@/lib/invoice-pdf";

/** "0330 1555999" -> "923301555999". Returns null when there is nothing dialable. */
function waNumber(phone: string | null): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length < 9) return null;
  if (digits.startsWith("92")) return digits;
  return `92${digits.replace(/^0+/, "")}`;
}

function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export function InvoiceShare({ invoice, brand, reference, title }: { invoice: InvoiceLike; brand: Brand; reference: string; title?: string }) {
  const [busy, setBusy] = useState<"download" | "whatsapp" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const build = async (action: "download" | "whatsapp") => {
    setBusy(action);
    setError(null);
    try {
      return await invoicePdfBlob(invoice, brand, reference, title);
    } catch {
      setError("Could not build the PDF. Use Print / Save PDF instead.");
      return null;
    } finally {
      setBusy(null);
    }
  };

  const download = async () => {
    const blob = await build("download");
    if (blob) save(blob, invoiceFileName(reference));
  };

  const share = async () => {
    const blob = await build("whatsapp");
    if (!blob) return;
    const name = invoiceFileName(reference);
    const file = new File([blob], name, { type: "application/pdf" });
    const message = `${brand.name}\n${reference} — ${invoice.client_name}`;

    // Phone and tablet: hand WhatsApp the file itself, recipient chosen there.
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: reference, text: message });
        return;
      } catch {
        // Cancelled or unavailable — fall through to the desktop path.
      }
    }

    // Desktop: save the PDF, open the chat, attach it there.
    save(blob, name);
    const to = waNumber(invoice.client_phone);
    window.open(`https://wa.me/${to ?? ""}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
    setError(`${name} downloaded — attach it in the WhatsApp window.`);
  };

  return (
    <div className="print:hidden">
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" onClick={download} disabled={busy !== null}>
          <Download className="h-4 w-4" aria-hidden="true" />
          {busy === "download" ? "Preparing…" : "Download PDF"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={share} disabled={busy !== null}>
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          {busy === "whatsapp" ? "Preparing…" : "Send on WhatsApp"}
        </Button>
      </div>
      {error && <p role="status" className="mt-2 text-sm text-muted">{error}</p>}
    </div>
  );
}
