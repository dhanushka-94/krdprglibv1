import type { NextConfig } from "next";

const adminPath = process.env.NEXT_PUBLIC_ADMIN_PATH ?? "k7x9p2";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: `/${adminPath}`, destination: "/admin" },
      { source: `/${adminPath}/:path*`, destination: "/admin/:path*" },
    ];
  },
};

export default nextConfig;
