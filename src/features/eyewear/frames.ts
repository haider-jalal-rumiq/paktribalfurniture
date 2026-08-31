/**
 * Frame catalogue.
 *
 * Placeholder inventory for the pitch: names and descriptions are written to
 * demonstrate the gallery. No frame carries a photograph yet, so each card
 * renders a drawn silhouette of its shape (see frame-silhouette.tsx). Set
 * `image` on a frame the moment a real photo exists and the card uses it.
 *
 * Deliberately no prices — lens prescription drives the final cost, and the
 * shop quotes in person. Every card ends in "ask about this frame" instead.
 */

export const FRAME_CATEGORIES = [
  "Native Visions",
  "Women's",
  "Men's",
  "Sunglasses",
  "Kids'",
] as const;

export type FrameCategory = (typeof FRAME_CATEGORIES)[number];

export interface Frame {
  id: string;
  name: string;
  collection: string;
  category: FrameCategory;
  shape: string;
  material: string;
  colors: readonly string[];
  blurb: string;
  /** Real photograph. Omit to fall back to the drawn silhouette. */
  image?: string;
  featured?: boolean;
}

export const frames: readonly Frame[] = [
  {
    id: "spa-poole",
    name: "Spa Poole",
    collection: "Native Visions",
    category: "Native Visions",
    shape: "Rectangle",
    material: "Hand-finished acetate",
    colors: ["Smoke", "Sunstone"],
    blurb:
      "Temple art after Virgil “Smoker” Marchand, whose work gives this frame its name.",
    featured: true,
  },
  {
    id: "colville",
    name: "Colville",
    collection: "Native Visions",
    category: "Native Visions",
    shape: "Round",
    material: "Titanium & acetate",
    colors: ["Antique bronze", "Ink"],
    blurb:
      "A thin metal round with carved detail running the length of each temple.",
    featured: true,
  },
  {
    id: "storyteller",
    name: "Storyteller",
    collection: "Native Visions",
    category: "Native Visions",
    shape: "Cat eye",
    material: "Layered acetate",
    colors: ["Turquoise", "Clay"],
    blurb:
      "Layered acetate that shows a second colour along the bevel as it catches light.",
    featured: true,
  },
  {
    id: "camelback",
    name: "Camelback",
    collection: "Sundance Select",
    category: "Men's",
    shape: "Square",
    material: "Matte acetate",
    colors: ["Slate", "Tortoise"],
    blurb: "A broad square that holds its shape on a wider face. Everyday frame.",
    featured: true,
  },
  {
    id: "papago",
    name: "Papago",
    collection: "Sundance Select",
    category: "Men's",
    shape: "Aviator",
    material: "Stainless steel",
    colors: ["Gunmetal", "Brushed gold"],
    blurb: "Classic double-bridge aviator, light enough to forget you're wearing it.",
  },
  {
    id: "verde",
    name: "Verde",
    collection: "Sundance Select",
    category: "Men's",
    shape: "Browline",
    material: "Acetate & metal",
    colors: ["Olive", "Walnut"],
    blurb: "Browline with a warm acetate top bar and a fine wire rim below.",
  },
  {
    id: "encanto",
    name: "Encanto",
    collection: "Sundance Select",
    category: "Women's",
    shape: "Cat eye",
    material: "Polished acetate",
    colors: ["Amber", "Rose smoke"],
    blurb: "A soft upsweep — flattering without announcing itself.",
    featured: true,
  },
  {
    id: "arcadia",
    name: "Arcadia",
    collection: "Sundance Select",
    category: "Women's",
    shape: "Oval",
    material: "Titanium",
    colors: ["Champagne", "Blush"],
    blurb: "Rimless-look titanium at barely twelve grams. Our lightest frame.",
  },
  {
    id: "ocotillo",
    name: "Ocotillo",
    collection: "Sundance Select",
    category: "Women's",
    shape: "Round",
    material: "Acetate",
    colors: ["Clay", "Sea glass"],
    blurb: "A generous round in warm clay, cut thin so it stays light on the nose.",
  },
  {
    id: "sonoran",
    name: "Sonoran",
    collection: "Sundance Select",
    category: "Sunglasses",
    shape: "Square",
    material: "Acetate, polarised",
    colors: ["Desert tortoise", "Black"],
    blurb: "Polarised and prescription-ready. Built for the drive home at 5pm.",
    featured: true,
  },
  {
    id: "dusk-runner",
    name: "Dusk Runner",
    collection: "Sundance Select",
    category: "Sunglasses",
    shape: "Wrap",
    material: "Nylon, polarised",
    colors: ["Matte black", "Sand"],
    blurb: "A wrap that stays put — for anyone who works or trains outdoors.",
  },
  {
    id: "little-bear",
    name: "Little Bear",
    collection: "Sundance Select",
    category: "Kids'",
    shape: "Round",
    material: "Flexible acetate",
    colors: ["Cactus", "Sunset"],
    blurb:
      "Bendable, spring-hinged and hard to break. Sized for four to ten year olds.",
  },
];

export const featuredFrames = frames.filter((frame) => frame.featured);

/** `undefined` category means "everything". */
export function filterFrames(category?: string): readonly Frame[] {
  if (!category || category === "All") return frames;
  return frames.filter((frame) => frame.category === category);
}

export function isFrameCategory(value: string): value is FrameCategory {
  return (FRAME_CATEGORIES as readonly string[]).includes(value);
}
