import { test, expect, chromium } from '@playwright/test';
import path from 'path';

test('简单调试测试 - 检查页面加载和控制台输出', async () => {
  const extensionPath = path.resolve(__dirname, '../extension/build');
  console.log('🚀 开始简单调试测试');
  console.log('📁 扩展路径:', extensionPath);

  // 启动浏览器并加载扩展
  const browser = await chromium.launchPersistentContext('', {
    headless: false, // 显示浏览器以便调试
    args: [
      `--load-extension=${extensionPath}`,
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  const page = await browser.newPage();
  
  // 收集所有控制台消息
  const consoleMessages: string[] = [];
  const errors: string[] = [];
  
  page.on('console', msg => {
    const message = `[${msg.type().toUpperCase()}] ${msg.text()}`;
    consoleMessages.push(message);
    console.log(message);
  });
  
  page.on('pageerror', error => {
    const errorMsg = `❌ 页面错误: ${error.message}`;
    errors.push(errorMsg);
    console.error(errorMsg);
  });
  
  // 等待扩展加载
  console.log('⏳ 等待扩展加载...');
  await page.waitForTimeout(5000);
  
  // 获取扩展ID
  const pages = await browser.pages();
  let extensionId = null;
  
  // 尝试从现有页面获取扩展ID
  for (const p of pages) {
    const url = p.url();
    if (url.includes('chrome-extension://')) {
      const match = url.match(/chrome-extension:\/\/([a-z]+)\//); 
      if (match) {
        extensionId = match[1];
        break;
      }
    }
  }
  
  // 如果没有找到，尝试通过Service Worker
  if (!extensionId) {
    console.log('🔍 尝试通过其他方式获取扩展ID...');
    // 使用固定的扩展ID进行测试（从之前的测试结果中获取）
    extensionId = 'hiicoienpmplgdljfodgcfnldnmegmeb';
    console.log('🎯 使用测试扩展ID:', extensionId);
  }
  
  if (!extensionId) {
    throw new Error('无法获取扩展ID');
  }
  
  console.log('✅ 扩展ID:', extensionId);
  
  // 打开管理界面
  const managerUrl = `chrome-extension://${extensionId}/manager.html`;
  console.log('🔗 打开管理界面:', managerUrl);
  
  await page.goto(managerUrl);
  
  // 等待页面加载
  console.log('⏳ 等待页面加载...');
  await page.waitForTimeout(3000);
  
  // 获取页面基本信息
  const title = await page.title();
  const url = page.url();
  
  console.log('📄 页面标题:', title);
  console.log('🔗 页面URL:', url);
  
  // 检查页面内容
  const bodyText = await page.textContent('body');
  console.log('📝 页面内容长度:', bodyText?.length || 0);
  
  // 检查是否有加载遮罩
  const loadingOverlay = await page.$('.fixed.inset-0.bg-white.bg-opacity-90');
  console.log('🔄 是否显示加载遮罩:', !!loadingOverlay);
  
  if (loadingOverlay) {
    const loadingText = await loadingOverlay.$eval('p', el => el.textContent);
    console.log('📝 加载文本:', loadingText);
  }
  
  // 等待更长时间看看是否会有变化
  console.log('⏳ 等待10秒观察页面变化...');
  await page.waitForTimeout(10000);
  
  // 再次检查页面状态
  const titleAfterWait = await page.title();
  const loadingOverlayAfterWait = await page.$('.fixed.inset-0.bg-white.bg-opacity-90');
  
  console.log('📄 等待后页面标题:', titleAfterWait);
  console.log('🔄 等待后是否仍显示加载遮罩:', !!loadingOverlayAfterWait);
  
  // 检查扩展桥梁和React状态
  const bridgeStatus = await page.evaluate(() => {
    return {
      hasBridge: typeof window.ExtensionBridge !== 'undefined',
      bridgeInitialized: window.ExtensionBridge?.isInitialized,
      isChromeExtension: window.ExtensionBridge?.isChromeExtension(),
      hasReact: typeof window.React !== 'undefined',
      hasReactRoot: document.querySelector('[data-reactroot]') !== null
    };
  });
  
  console.log('🌉 扩展桥梁状态:', bridgeStatus);
  
  // 输出所有收集到的控制台消息
  console.log('\n📋 所有控制台消息:');
  consoleMessages.forEach((msg, index) => {
    console.log(`${index + 1}. ${msg}`);
  });
  
  // 输出所有错误
  if (errors.length > 0) {
    console.log('\n❌ 所有错误:');
    errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }
  
  // 保持浏览器打开一段时间以便手动检查
  console.log('\n🔍 保持浏览器打开30秒以便手动检查...');
  await page.waitForTimeout(30000);
  
  await browser.close();
  
  // 基本断言
  expect(title).toContain('Tabify');
});