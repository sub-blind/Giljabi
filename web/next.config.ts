import type { NextConfig } from "next";

const backend = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  // 개발 서버와 운영 미리보기의 산출물이 서로 덮어쓰지 않게 한다.
  distDir: process.env.STORYROUTE_DIST_DIR || ".next",
  async rewrites() {
    const api = backend.replace(/\/$/, "");
    return [
      { source: "/api/v1/day-trip/:path*", destination: `${api}/api/v1/day-trip/:path*` },
      { source: "/api/v1/auth/:path*", destination: `${api}/api/v1/auth/:path*` },
      { source: "/api/v1/account/:path*", destination: `${api}/api/v1/account/:path*` },
    ];
  },
};

export default nextConfig;
