import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@remotion/renderer", "@remotion/lambda", "googleapis"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "fmfcjzifyqexhzwafjea.supabase.co",
      },
    ],
  },
};

export default nextConfig;

