"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Admin apps carry their own chrome. Keep in step with PROTECTED_AREAS. */
const APPS = ["/cms", "/shop"];

/**
 * The CMS and the shop ledger are apps, not pages on the marketing site, so
 * they render without the site header and footer. Server children pass
 * straight through — only the mount decision happens on the client, and
 * usePathname resolves during SSR so there is no flash of marketing chrome.
 */
export function ChromeGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (APPS.some((base) => pathname === base || pathname.startsWith(`${base}/`))) return null;
  return <>{children}</>;
}
