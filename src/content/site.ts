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
  map: {
    /** The embeddable iframe src for the Google Maps listing. */
    embedSrc: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3321.2054671720866!2d72.98039107434138!3d33.651837638769095!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x38df97c56a73cc7f%3A0x5a55fdb90a59cabf!2sPak%20Tribal%20Furniture!5e0!3m2!1sen!2s!4v1789367391547!5m2!1sen!2s",
    /** A plain link to the same listing, for "Get directions" / opening the Maps app. */
    href: "https://www.google.com/maps?cid=6509387807618353855",
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
