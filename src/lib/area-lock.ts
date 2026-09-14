/**
 * A PIN over specific CMS tabs, not a second auth system — every admin page
 * still requires the same Supabase admin login (see AGENTS.md: one role,
 * "no ... multi-user roles"). This exists so a worker handed the admin
 * login can be pointed at Inventory and Expenses without wandering into
 * Orders, Clients, Invoices or Sales; the owner unlocks those with the PIN.
 * Enforced client-side only — anyone with the admin login already reaches
 * the same data through the API regardless of this screen.
 */
export const AREA_LOCK_PIN = "1555";

export type LockedApp = "factory" | "shop";

/** Path prefixes that need no PIN. Everything else under the app is locked. */
export const OPEN_AREA_PATHS: Record<LockedApp, readonly string[]> = {
  factory: ["/factory/inventory", "/factory/expenses"],
  shop: ["/shop/invoices", "/shop/expenses"],
};

export function areaFor(pathname: string): LockedApp | null {
  if (pathname.startsWith("/factory")) return "factory";
  if (pathname.startsWith("/shop")) return "shop";
  return null;
}

/** True when `pathname` needs no PIN: the login screen, or an open tab's subtree. */
export function isOpenPath(pathname: string): boolean {
  const area = areaFor(pathname);
  if (!area) return true;
  if (pathname === `/${area}/login`) return true;
  return OPEN_AREA_PATHS[area].some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
