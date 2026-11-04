import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The isolated CMS fixture run must not interrupt an existing development server.
  distDir: process.env.PTF_CMS_VERIFY === "1" ? ".verify-cms/next" : ".next",
  images: {
    // AVIF is preferred by browsers that accept it; WebP is the fallback.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    // Brand photos and icons change rarely; a day is the longest a replaced file should lag.
    const dailyCache = [{ key: "Cache-Control", value: "public, max-age=86400" }];
    return [
      { source: "/images/:path*", headers: dailyCache },
      { source: "/icons/:path*", headers: dailyCache },
    ];
  },
  async redirects() {
    return [
      { source: "/cms", destination: "/factory", permanent: true },
      { source: "/cms/:path*", destination: "/factory/:path*", permanent: true },
      { source: "/cms.webmanifest", destination: "/factory.webmanifest", permanent: true },
      { source: "/eyewear", destination: "/collections", permanent: true },
      { source: "/native-visions", destination: "/collections", permanent: true },
      { source: "/veterans", destination: "/", permanent: true },
      { source: "/about", destination: "/", permanent: true },
      { source: "/exclusive-eyewear", destination: "/collections", permanent: true },
      { source: "/attention-veterans", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
