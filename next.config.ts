import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  // A package-lock.json in the home directory would otherwise be treated as the workspace root.
  outputFileTracingRoot: path.join(__dirname),
  serverExternalPackages: ["@electric-sql/pglite", "hash-wasm"],
};

export default nextConfig;
