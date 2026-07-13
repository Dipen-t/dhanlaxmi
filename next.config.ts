import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow iPad / phones on the LAN to load Next.js dev JS (touch + sound need this).
  allowedDevOrigins: ["192.168.1.100", "192.168.1.*", "*.local"],
  serverExternalPackages: ["@react-pdf/renderer", "sharp"],
  async headers() {
    return [
      {
        // iPad Safari caches /public audio hard; always revalidate.
        source: "/sounds/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
