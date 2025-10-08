const ExtensionAutoBuildPlugin = require('./extension-auto-build-plugin');

const nextConfig = {
  // 启用静态导出，用于Chrome扩展构建
  output: "export",
  // 设置构建目录
  distDir: 'static-export',
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
    optimizeCss: false, // 禁用CSS优化，可能有助于减少内联脚本
    // 尝试禁用可能导致内联脚本的实验性功能
    adjustFontFallbacks: false,
  },
  // 静态导出配置
  trailingSlash: false,
  skipTrailingSlashRedirect: false,
  // 禁用错误页面预渲染
  generateBuildId: () => 'build',
  // 移除assetPrefix以确保静态导出正常工作
  // assetPrefix: process.env.NODE_ENV === 'production' ? '/nextstatic' : '',
  compiler: {
    removeConsole: false, // 保持console以备调试
    // 尝试禁用可能导致内联脚本的编译器优化
    reactRemoveProperties: false,
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

    // 在生产环境客户端构建中优化脚本输出
    if (!dev && !isServer) {
      // 尝试修改优化配置以减少内联脚本
      if (config.optimization) {
        config.optimization.runtimeChunk = false; // 禁用runtime chunk
        config.optimization.splitChunks = {
          chunks: 'all',
          cacheGroups: {
            // 将内联的模块代码提取到外部chunks
            default: false,
            vendors: false,
            framework: {
              name: 'framework',
              chunks: 'all',
              enforce: true,
            },
          },
        };
      }
    }

    return config;
  },
};

module.exports = nextConfig;