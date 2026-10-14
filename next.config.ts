import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      allowedOrigins: ["dhanlaxmi.nnsolutions.co.in"],
    },
  },
  // Allow iPad / phones on the LAN to load Next.js dev JS (touch + sound need this).
  allowedDevOrigins: ["192.168.1.100", "192.168.1.*", "*.local"],
  outputFileTracingIncludes: {
    "/api/**/*": ["./app/logo.png"],
    "/api/menus/*/pdf": ["./public/menu-themes/*/background-*pdf.jpg", "./public/menu-themes/logo-*.png", "./public/fonts/menu/*.ttf", "./public/menu-category-images/pdf/*.png"],
    "/api/kitchen-menus/*/pdf": ["./public/fonts/menu/*.ttf"],
  },
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
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
  turbopack: {
    resolveAlias: {
      canvas: "./empty-canvas.js",
    },
  },
};

export default nextConfig;
