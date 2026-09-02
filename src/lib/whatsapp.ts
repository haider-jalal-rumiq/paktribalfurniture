import { site } from "@/content/site";

interface WhatsAppInquiry {
  name: string;
  phone: string;
  city?: string | null;
  category?: string | null;
  product?: string | null;
  wood?: string | null;
  message: string;
}

export function buildWhatsAppUrl(inquiry: WhatsAppInquiry): string {
  const lines = [
    `Hello ${site.name}, I have a furniture enquiry.`,
    "",
    `Name: ${inquiry.name}`,
    `Phone: ${inquiry.phone}`,
    inquiry.city ? `City: ${inquiry.city}` : null,
    inquiry.category ? `Category: ${inquiry.category}` : null,
    inquiry.product ? `Product: ${inquiry.product}` : null,
    inquiry.wood ? `Wood: ${inquiry.wood}` : null,
    `Details: ${inquiry.message}`,
  ].filter((line): line is string => Boolean(line));

  return `${site.whatsapp.href}?text=${encodeURIComponent(lines.join("\n"))}`;
}
