import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@remotion/renderer", "@remotion/lambda"],
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

