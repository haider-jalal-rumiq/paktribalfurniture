export interface NavLink {
  label: string;
  href: string;
}

export const navLinks: readonly NavLink[] = [
  { label: "Eyewear", href: "/eyewear" },
  { label: "Native Visions", href: "/native-visions" },
  { label: "Veterans", href: "/veterans" },
  { label: "About", href: "/about" },
  { label: "Visit Us", href: "/contact" },
];
