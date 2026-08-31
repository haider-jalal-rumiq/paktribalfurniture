import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The WordPress site's URLs are already indexed and linked from elsewhere.
  async redirects() {
    return [
      {
        source: "/exclusive-eyewear",
        destination: "/native-visions",
        permanent: true,
      },
      {
        source: "/attention-veterans",
        destination: "/veterans",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
