import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

void initOpenNextCloudflareForDev();

const basePath = process.env.BASE_PATH ?? process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  basePath: basePath || undefined,
  output: "standalone",
  reactStrictMode: true,
  trailingSlash: false,
  transpilePackages: ["@workspace/api-client-react"],
  serverExternalPackages: [
    "@cloudflare/playwright",
    "playwright",
    "pdfkit",
    "pngjs",
    "pino",
    "jsdom",
    "cheerio",
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
