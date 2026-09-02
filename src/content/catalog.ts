export const categories = [
  {
    slug: "beds",
    name: "Beds",
    shortName: "Beds",
    description: "Statement frames and considered bedroom furniture.",
    image: "/images/furniture/bedroom.jpg",
  },
  {
    slug: "sofas",
    name: "Sofas",
    shortName: "Sofas",
    description: "Seating shaped around comfort, proportion, and material.",
    image: "/images/furniture/hero-living-room.jpg",
  },
  {
    slug: "chairs-study-tables",
    name: "Chairs & Study Tables",
    shortName: "Chairs & desks",
    description: "Useful pieces for reading, working, and everyday rituals.",
    image: "/images/furniture/dining.jpg",
  },
  {
    slug: "dining-tables",
    name: "Dining Tables",
    shortName: "Dining",
    description: "Tables and dining pieces designed around gathering.",
    image: "/images/furniture/dining.jpg",
  },
  {
    slug: "mirrors-lamps-decor",
    name: "Mirrors, Lamps & Decor",
    shortName: "Decor",
    description: "Finishing pieces that bring light, texture, and balance.",
    image: "/images/furniture/console.jpg",
  },
  {
    slug: "chests-consoles-side-tables",
    name: "Chests, Consoles & Side Tables",
    shortName: "Consoles",
    description: "Functional storage and smaller surfaces for every room.",
    image: "/images/furniture/console.jpg",
  },
  {
    slug: "tv-consoles-shoe-racks-bookshelves",
    name: "TV Consoles, Shoe Racks & Bookshelves",
    shortName: "Storage",
    description: "Purpose-built storage that keeps the room composed.",
    image: "/images/furniture/bedroom.jpg",
  },
  {
    slug: "custom-furniture",
    name: "Custom Furniture",
    shortName: "Custom",
    description: "A direct enquiry path for dimensions, references, and wood choice.",
    image: "/images/furniture/workshop.jpg",
  },
] as const;

export type CategorySlug = (typeof categories)[number]["slug"];

export function getCategory(slug: string) {
  return categories.find((category) => category.slug === slug);
}
