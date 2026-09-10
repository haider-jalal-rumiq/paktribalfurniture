import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: { default: "Factory", template: "%s | PTF Factory" },
  robots: { index: false, follow: false },
  manifest: "/factory.webmanifest",
  appleWebApp: { capable: true, title: "PTF Factory", statusBarStyle: "default" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = { themeColor: "#ffffff", colorScheme: "light" };

// Orders, balances and "today" must never be served from a build-time snapshot.
export const dynamic = "force-dynamic";

export default function FactoryLayout({ children }: { children: ReactNode }) {
  return children;
}
