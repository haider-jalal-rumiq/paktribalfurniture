import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: { default: "Orders", template: "%s | PTF Orders" },
  robots: { index: false, follow: false },
  manifest: "/cms.webmanifest",
  appleWebApp: { capable: true, title: "PTF Orders", statusBarStyle: "default" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = { themeColor: "#f3f4ef" };

// Orders, balances and "today" must never be served from a build-time snapshot.
export const dynamic = "force-dynamic";

export default function CmsLayout({ children }: { children: ReactNode }) {
  return children;
}
