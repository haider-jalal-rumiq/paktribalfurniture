import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: { default: "Shop", template: "%s | PTF Shop" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#ffffff", colorScheme: "light" };

// Sales, profit and "today" must never be served from a build-time snapshot.
export const dynamic = "force-dynamic";

export default function ShopLayout({ children }: { children: ReactNode }) {
  return children;
}
