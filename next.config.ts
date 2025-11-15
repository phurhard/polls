import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: "/home/phurhard/Desktop/Personal/polls",
  },
  async rewrites() {
    const tus = process.env.TUSD_INTERNAL_URL || "http://localhost:1080"
    return [
      {
        source: "/uploads/:path*",
        destination: `${tus}/files/:path*`,
      },
    ]
  },
};

export default nextConfig;
