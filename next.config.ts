import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  serverExternalPackages: ["@electric-sql/pglite", "hash-wasm"],
};

export default nextConfig;
