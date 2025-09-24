import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Playwright配置文件
 * 专门为Chrome扩展测试优化
 */
export default defineConfig({
  // 测试目录
  testDir: './test',
  
  // 全局超时设置
  timeout: 180000, // 增加到3分钟，给Chrome扩展加载足够时间
  expect: {
    timeout: 10000
  },
  
  // 测试运行配置
  fullyParallel: false, // Chrome扩展测试不适合并行
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // 单线程运行，避免扩展冲突
  
  // 报告配置
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list']
  ],
  
  // 输出目录
  outputDir: 'test-results/artifacts',
  
  // 全局设置
  use: {
    // 基础URL（如果需要）
    // baseURL: 'http://localhost:3000',
    
    // 跟踪配置
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // 浏览器配置
    headless: false, // 显示浏览器窗口，便于调试
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    
    // Chrome扩展特定配置
    launchOptions: {
      args: [
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-extensions-except=' + path.resolve('./extension/build'),
        '--load-extension=' + path.resolve('./extension/build'),
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    }
  },

  // 项目配置
  projects: [
    {
      name: 'chromium-extension',
      use: { 
        ...devices['Desktop Chrome'],
        // Chrome扩展测试专用配置
        contextOptions: {
          // 忽略默认参数，使用自定义启动参数
          ignoreDefaultArgs: ['--disable-extensions'],
        }
      },
    },
  ],

  // Web服务器配置（如果需要本地服务器）
  // webServer: {
  //   command: 'npm run dev',
  //   port: 3000,
  //   reuseExistingServer: !process.env.CI,
  // },
});