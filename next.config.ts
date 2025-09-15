import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    build: {
      output: {
        root: "/home/phurhard/Desktop/Personal/polls",
        path: "./dist",
      },
    },
  },
};

export default nextConfig;
