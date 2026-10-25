import type { NextConfig } from "next";
import { securityHeaders, transportHeaders } from "./lib/security/headers";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: [...securityHeaders, ...transportHeaders(process.env.SITE_URL ?? "http://127.0.0.1:3000")] }];
  },
  // A 10 MiB file plus multipart fields must reach the bounded upload handler intact.
  // Bound parallel build work on machines with limited available memory.
  experimental: { proxyClientMaxBodySize: '11mb', cpus: 2 },
};

export default nextConfig;
