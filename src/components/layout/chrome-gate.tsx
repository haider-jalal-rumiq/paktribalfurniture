"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * The CMS is an app, not a page on the marketing site, so it renders without
 * the site header and footer. Server children pass straight through — only the
 * mount decision happens on the client, and usePathname resolves during SSR so
 * there is no flash of marketing chrome.
 */
export function ChromeGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/cms" || pathname.startsWith("/cms/")) return null;
  return <>{children}</>;
}
