import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

void initOpenNextCloudflareForDev();

const monorepoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const basePath = process.env.BASE_PATH ?? process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  basePath: basePath || undefined,
  output: "standalone",
  reactStrictMode: true,
  trailingSlash: false,
  transpilePackages: ["@workspace/api-client-react"],
  serverExternalPackages: [
    "@axe-core/playwright",
    "axe-core",
    "@cloudflare/playwright",
    "playwright",
    "pdfkit",
    "pngjs",
    "pino",
    "jsdom",
    "cheerio",
    "lightningcss",
    "lightningcss-darwin-arm64",
    "lightningcss-darwin-x64",
    "@tailwindcss/oxide",
    "@tailwindcss/oxide-darwin-arm64",
  ],
  turbopack: {
    root: monorepoRoot,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  async redirects() {
    return [
      {
        source: "/resources/compliance/eaa",
        destination: "/eaa",
        permanent: true,
      },
      {
        source: "/resources/checklists/eaa",
        destination: "/resources/eaa-checklist",
        permanent: true,
      },
      {
        source: "/resources/guides/wcag",
        destination: "/resources/wcag-guide",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
