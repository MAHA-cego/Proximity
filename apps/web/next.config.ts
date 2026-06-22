import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@proximity/simulation",
    "@proximity/ai",
    "@proximity/protocol",
  ],
};

export default nextConfig;
