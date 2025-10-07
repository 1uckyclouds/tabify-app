import type { NextConfig } from "next";
const ExtensionAutoBuildPlugin = require('./extension-auto-build-plugin');

const nextConfig: NextConfig = {
  // 启用静态导出，用于Chrome扩展构建
  output: "export",
  // 设置构建目录
  distDir: 'out',
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizeCss: true,
  },
  // 静态导出配置
  trailingSlash: false,
  skipTrailingSlashRedirect: false,
  // 禁用错误页面预渲染
  generateBuildId: () => 'build',
  // 移除assetPrefix以确保静态导出正常工作
  // assetPrefix: process.env.NODE_ENV === 'production' ? '/nextstatic' : '',
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // 禁用静态优化以避免预渲染错误
  ...(process.env.NODE_ENV === 'production' && {
    generateEtags: false,
  }),
  webpack: (config, { dev, isServer }) => {
    // 只在开发模式下为客户端构建添加扩展自动构建插件
    if (dev && !isServer) {
      const ExtensionAutoBuildPlugin = require('./extension-auto-build-plugin');
      config.plugins.push(new ExtensionAutoBuildPlugin());
    }
    return config;
  },
};

export default nextConfig;
