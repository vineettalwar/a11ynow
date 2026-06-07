import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

void initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  trailingSlash: false,
  transpilePackages: ["@workspace/api-client-react"],
};

export default nextConfig;
