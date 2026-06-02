import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // sharp / archiver 需要 Node 运行时，不能被打进 edge bundle
  serverExternalPackages: ["sharp", "archiver"],
};

export default nextConfig;
