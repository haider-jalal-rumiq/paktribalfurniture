import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The isolated CMS fixture run must not interrupt an existing development server.
  distDir: process.env.PTF_CMS_VERIFY === "1" ? ".verify-cms/next" : ".next",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async redirects() {
    return [
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
