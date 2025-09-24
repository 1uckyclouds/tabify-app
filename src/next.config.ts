import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 启用静态导出，用于Chrome扩展构建
  output: "export",
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // CSP优化配置 - 减少内联脚本生成
  experimental: {
    // 启用严格的head标签处理，减少内联脚本
    strictNextHead: true,
    // 优化CSS处理，避免内联样式
    optimizeCss: true,
  },
  // 配置资源前缀，统一资源路径（修复为绝对路径）
  assetPrefix: "/",
  // 禁用运行时配置，避免动态脚本注入
  publicRuntimeConfig: {},
  serverRuntimeConfig: {},
  // 优化构建输出
  compiler: {
    // 移除console.log（生产环境）
    removeConsole: process.env.NODE_ENV === "production",
  },
};

export default nextConfig;
