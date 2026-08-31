/**
 * Single source of truth for business facts.
 *
 * Everything on the site — pages, footer, JSON-LD — reads from here, so the
 * phone number and address exist in exactly one place.
 *
 * Verified against sundanceoptical.com and public local listings, Aug 2026.
 */

export interface OpeningHours {
  /** 0 = Sunday, matching Date.prototype.getDay(). */
  day: number;
  label: string;
  /** Minutes from midnight. `null` on both when closed. */
  opens: number | null;
  closes: number | null;
}

export interface Review {
  quote: string;
  author: string;
  source: string;
}

export interface TimelineEntry {
  year: string;
  title: string;
  body: string;
}

const HOUR = 60;

export const site = {
  name: "Sundance Optical",
  legalName: "Sundance Optical Inc.",
  tagline: "Veteran owned and operated",
  description:
    "Licensed opticians in Phoenix, Arizona. Eyeglasses, sunglasses and repairs for the whole family — from a family serving Phoenix since 1951.",

  // TODO: point at the real domain once the client approves the rebuild.
  url: "https://sundanceoptical.com",

  phone: "(602) 277-5007",
  phoneHref: "tel:+16022775007",
  email: "sundanceoptical@gmail.com",

  address: {
    street: "4201 North 16th Street",
    suite: "Suite 160",
    city: "Phoenix",
    state: "AZ",
    stateFull: "Arizona",
    zip: "85016",
    country: "US",
  },

  /** Approximate — 16th St just north of Indian School Rd. Refine from Google Business Profile. */
  geo: { latitude: 33.4977, longitude: -112.0477 },

  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=4201+N+16th+St+Suite+160+Phoenix+AZ+85016",
  directionsUrl:
    "https://www.google.com/maps/dir/?api=1&destination=4201+N+16th+St+Suite+160+Phoenix+AZ+85016",

  /** IANA zone — Arizona does not observe daylight saving. */
  timeZone: "America/Phoenix",
} as const;

export const openingHours: readonly OpeningHours[] = [
  { day: 1, label: "Monday", opens: 8 * HOUR, closes: 17 * HOUR },
  { day: 2, label: "Tuesday", opens: 8 * HOUR, closes: 17 * HOUR },
  { day: 3, label: "Wednesday", opens: 8 * HOUR, closes: 17 * HOUR },
  { day: 4, label: "Thursday", opens: 8 * HOUR, closes: 17 * HOUR },
  { day: 5, label: "Friday", opens: 8 * HOUR, closes: 17 * HOUR },
  { day: 6, label: "Saturday", opens: null, closes: null },
  { day: 0, label: "Sunday", opens: null, closes: null },
];

/** Written from the two landmarks patients actually navigate by. */
export const landmarks = [
  {
    title: "From the VA Medical Center",
    body: "We're about a mile east of the Carl T. Hayden VA Medical Center — straight out Indian School Road, then north on 16th Street.",
  },
  {
    title: "From Phoenix Indian Medical Center",
    body: "Directly across 16th Street, next door to Drumbeats. You can walk it.",
  },
] as const;

export const trustPoints = [
  "Veteran owned and operated",
  "Serving Phoenix since 1951",
  "Any doctor's prescription accepted",
  "AHCCCS / AIHP accepted",
  "ABO certified opticians",
] as const;

export const timeline: readonly TimelineEntry[] = [
  {
    year: "1951",
    title: "A family business begins",
    body: "The Clark family starts caring for Phoenix eyes — three generations of licensed opticians before Sundance ever opened its doors.",
  },
  {
    year: "1993",
    title: "Called to serve",
    body: "Philip Clark joins the United States Navy Reserve, mobilizing for Desert Shield / Desert Storm and Operation Enduring Freedom.",
  },
  {
    year: "2014",
    title: "Sundance Optical opens",
    body: "A shop of his own on 16th Street, chosen to sit within walking distance of the neighbors it was built to serve.",
  },
  {
    year: "Today",
    title: "Still on 16th Street",
    body: "Same licensed opticians, same chair, same promise: your glasses fitted properly, by someone who knows your name.",
  },
];

export const staff = {
  name: "Philip K. Clark",
  role: "Licensed Optician & Owner",
  license: "Arizona License #LDO-000417",
  credentials: [
    "Chief Petty Officer, USN (Retired)",
    "Arizona Licensed Optician since 1979, ABO certified",
    "President, COCO Corp (Clark Optical / Cochise Optical), 1986–1989",
    "President & Owner, Clark / Evans Optical Inc., 1989–1993",
    "United States Navy Reserve, 1993–2016",
    "Mobilized for Desert Shield / Desert Storm and Operation Enduring Freedom",
    "Optician & Manager, Pearle and Benson Optical, 1993–2007",
    "Licensed Optician, Arizona's Vision, 2007–2014",
    "Founded Sundance Optical in 2014",
  ],
} as const;

/**
 * Real quotes from public listings, attributed to their source.
 *
 * TODO: replace with the client's own Google reviews once we have access to
 * their Business Profile. Never pad this array with invented testimonials.
 */
export const reviews: readonly Review[] = [
  {
    quote:
      "My glasses broke and they helped fix me up real quick! Great people and great service!",
    author: "Verified customer",
    source: "Yahoo Local",
  },
  {
    quote: "Great and inexpensive place to get your glasses.",
    author: "Verified customer",
    source: "Yelp",
  },
];
