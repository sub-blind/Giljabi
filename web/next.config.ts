import type { NextConfig } from "next";

const backend = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/api/v1/day-trip/:path*", destination: `${backend.replace(/\/$/, "")}/api/v1/day-trip/:path*` }];
  },
};

export default nextConfig;
