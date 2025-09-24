import { test, expect, chromium, BrowserContext, Page } from '@playwright/test';
import path from 'path';

/**
 * React应用初始化调试测试
 * 专门用于调试React应用初始化问题
 */

test.describe('React应用初始化调试', () => {
  let context: BrowserContext;
  let page: Page;
  const extensionPath = path.resolve(__dirname, '../extension/build');

  test.beforeAll(async () => {
    console.log('🚀 启动Chrome浏览器并加载扩展...');
    
    const browser = await chromium.launch({
      headless: false, // 显示浏览器窗口以便调试
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--allow-running-insecure-content'
      ]
    });

    context = await browser.newContext();
    page = await context.newPage();
    
    // 监听所有控制台消息
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      console.log(`[${type.toUpperCase()}] ${text}`);
    });
    
    // 监听页面错误
    page.on('pageerror', error => {
      console.error('页面错误:', error.message);
    });
    
    // 等待扩展加载
    await page.waitForTimeout(5000);
  });

  test.afterAll(async () => {
    if (context) {
      await context.close();
    }
  });

  test('调试React应用初始化过程', async () => {
    console.log('📋 开始React应用初始化调试测试');
    
    // 获取扩展ID - 使用与原始测试相同的方法
    let extensionId = '';
    
    console.log('🔍 开始获取扩展ID...');
    
    // 方法1: 通过现有页面获取扩展ID
    const pages = context.pages();
    console.log(`📄 当前页面数量: ${pages.length}`);
    
    for (const p of pages) {
      const url = p.url();
      console.log(`📄 页面URL: ${url}`);
      if (url.startsWith('chrome-extension://')) {
        const match = url.match(/chrome-extension:\/\/([a-z]{32})/);
        if (match) {
          extensionId = match[1];
          console.log(`✅ 通过页面URL获取扩展ID: ${extensionId}`);
          break;
        }
      }
    }
    
    // 方法2: 通过service worker获取
    if (!extensionId) {
      console.log('🔍 尝试通过Service Worker获取扩展ID...');
      const serviceWorkers = context.serviceWorkers();
      console.log(`🔧 Service Worker数量: ${serviceWorkers.length}`);
      
      for (const sw of serviceWorkers) {
        const url = sw.url();
        console.log(`🔧 Service Worker URL: ${url}`);
        if (url.includes('chrome-extension://')) {
          const match = url.match(/chrome-extension:\/\/([a-z]{32})/);
          if (match) {
            extensionId = match[1];
            console.log(`✅ 通过Service Worker获取扩展ID: ${extensionId}`);
            break;
          }
        }
      }
    }
    
    // 方法3: 创建新页面并检查chrome.runtime
    if (!extensionId) {
      console.log('🔍 尝试通过chrome.runtime获取扩展ID...');
      const testPage = await context.newPage();
      try {
        await testPage.waitForTimeout(1000);
        extensionId = await testPage.evaluate(() => {
          return (chrome as any)?.runtime?.id || null;
        });
        if (extensionId) {
          console.log(`✅ 通过chrome.runtime获取扩展ID: ${extensionId}`);
        }
      } catch (error) {
        console.log('⚠️ 无法通过chrome.runtime获取扩展ID:', (error as Error).message);
      } finally {
        await testPage.close();
      }
    }
    
    // 验证扩展ID
    if (!extensionId) {
      throw new Error('无法获取扩展ID，请检查扩展是否正确加载');
    }
    
    if (!extensionId.match(/^[a-z]{32}$/)) {
      throw new Error(`扩展ID格式不正确: ${extensionId}`);
    }
    
    console.log('🎯 最终扩展ID:', extensionId);
    
    // 访问管理界面
    const managerUrl = `chrome-extension://${extensionId}/manager.html`;
    console.log('🔗 访问管理界面:', managerUrl);
    
    await page.goto(managerUrl, { waitUntil: 'networkidle' });
    
    // 等待足够长的时间让React应用初始化
    console.log('⏳ 等待React应用初始化...');
    await page.waitForTimeout(10000);
    
    // 检查页面状态
    const pageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        readyState: document.readyState,
        bodyText: document.body.textContent?.substring(0, 200),
        hasReactRoot: !!document.querySelector('#__next') || !!document.querySelector('[data-reactroot]'),
        scriptCount: document.querySelectorAll('script').length,
        hasLoadingOverlay: !!document.querySelector('.fixed.inset-0.bg-white.bg-opacity-90')
      };
    });
    
    console.log('📊 页面状态:', pageInfo);
    
    // 检查是否有React相关的全局变量
    const reactInfo = await page.evaluate(() => {
      return {
        hasReact: typeof (window as any).React !== 'undefined',
        hasReactDOM: typeof (window as any).ReactDOM !== 'undefined',
        hasNext: typeof (window as any).__NEXT_DATA__ !== 'undefined',
        windowKeys: Object.keys(window).filter(key => key.includes('React') || key.includes('next') || key.includes('__')).slice(0, 10)
      };
    });
    
    console.log('⚛️ React信息:', reactInfo);
    
    // 等待更长时间，看看是否有延迟的初始化
    console.log('⏳ 继续等待可能的延迟初始化...');
    await page.waitForTimeout(5000);
    
    // 再次检查页面标题
    const finalTitle = await page.title();
    console.log('📄 最终页面标题:', finalTitle);
    
    // 截图保存
    await page.screenshot({ path: 'debug-react-init.png', fullPage: true });
    console.log('📸 调试截图已保存: debug-react-init.png');
  });
});