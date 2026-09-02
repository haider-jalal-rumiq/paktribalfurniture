const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const site = {
  name: "Pak Tribal Furniture",
  shortName: "PTF",
  description:
    "A digital catalogue for Pak Tribal Furniture, featuring solid-wood furniture, home accents, and custom enquiries.",
  url: rawSiteUrl,
  instagramUrl: "https://www.instagram.com/paktribalfurniture/",
  whatsapp: {
    display: "+92 330 1555999",
    international: "923301555999",
    href: "https://wa.me/923301555999",
  },
} as const;

export const woodTypes = [
  {
    slug: "rosewood",
    name: "Rosewood",
    note: "A deep-toned choice for statement furniture and carved detail.",
  },
  {
    slug: "cedar",
    name: "Cedar wood",
    note: "Warm in character, with a naturally distinctive grain.",
  },
  {
    slug: "pine",
    name: "Pine wood",
    note: "A lighter wood option for relaxed, adaptable pieces.",
  },
  {
    slug: "mango",
    name: "Mango wood",
    note: "Expressive grain for furniture with visual movement.",
  },
  {
    slug: "walnut",
    name: "Walnut wood",
    note: "A rich, refined option for clean profiles and darker finishes.",
  },
] as const;

export type WoodTypeSlug = (typeof woodTypes)[number]["slug"];
