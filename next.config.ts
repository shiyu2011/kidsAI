import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["10.0.0.206"],
  // Prisma client is generated at build time
  outputFileTracingIncludes: {
    "/**": ["./src/generated/**/*"],
  },
};

export default nextConfig;
