import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @napi-rs/canvas 是原生模块，不能被打进 bundle，需作为外部包
  serverExternalPackages: ["@napi-rs/canvas"],
  // 关键：把中文字体文件一并打进 /api/generate 的 Serverless 函数，
  // 否则 Vercel 上 process.cwd() 找不到字体，中文会渲染成方块。
  outputFileTracingIncludes: {
    "/api/generate": ["./assets/fonts/**"],
  },
};

export default nextConfig;
