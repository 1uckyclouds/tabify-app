/**
 * CSP验证测试
 * 验证Chrome扩展的CSP配置是否正确，不再出现unsafe-inline警告
 */

const { chromium } = require('@playwright/test');
const path = require('path');

async function validateCSP() {
  console.log('🔍 开始CSP验证测试...');
  
  const extensionPath = path.resolve('./extension/build');
  console.log(`📁 扩展路径: ${extensionPath}`);
  
  let context;
  
  try {
    // 启动Chrome浏览器并加载扩展
    console.log('🌐 启动Chrome浏览器并加载扩展...');
    context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ],
      viewport: { width: 1280, height: 720 }
    });
    
    console.log('⏳ 等待扩展加载...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 检查Service Workers
    const workers = context.serviceWorkers();
    console.log(`🔧 Service Worker数量: ${workers.length}`);
    
    let extensionId = null;
    for (let i = 0; i < workers.length; i++) {
      const worker = workers[i];
      const workerUrl = worker.url();
      console.log(`Service Worker ${i + 1}: ${workerUrl}`);
      
      // 从Service Worker URL中提取扩展ID
      if (workerUrl.includes('chrome-extension://')) {
        const match = workerUrl.match(/chrome-extension:\/\/([a-z]{32})/);
        if (match) {
          extensionId = match[1];
          console.log(`🎯 扩展ID: ${extensionId}`);
        }
      }
    }
    
    if (extensionId) {
      console.log('✅ 扩展已成功加载');
      
      // 尝试访问管理界面
      const managerUrl = `chrome-extension://${extensionId}/manager.html`;
      console.log(`🔗 访问管理界面: ${managerUrl}`);
      
      const managerPage = await context.newPage();
      
      // 收集控制台消息
      const consoleMessages = [];
      const cspViolations = [];
      
      managerPage.on('console', msg => {
        const text = msg.text();
        consoleMessages.push(text);
        
        // 检查CSP违规
        if (text.includes('Content Security Policy') || text.includes('unsafe-inline') || text.includes('CSP')) {
          cspViolations.push(text);
        }
      });
      
      try {
        await managerPage.goto(managerUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
        await managerPage.waitForTimeout(3000);
        
        const title = await managerPage.title();
        console.log(`📄 页面标题: ${title}`);
        
        // 检查页面是否正常加载
        const pageInfo = await managerPage.evaluate(() => {
          return {
            hasBody: !!document.body,
            bodyContent: document.body?.textContent?.substring(0, 100) || '',
            scriptCount: document.querySelectorAll('script').length,
            linkCount: document.querySelectorAll('link').length
          };
        });
        
        console.log('📊 页面信息:', pageInfo);
        
        // 检查CSP违规
        console.log('🔍 CSP违规检查:');
        if (cspViolations.length === 0) {
          console.log('✅ 没有发现CSP违规！CSP配置修复成功');
        } else {
          console.log('❌ 发现CSP违规:');
          cspViolations.forEach((violation, index) => {
            console.log(`  ${index + 1}. ${violation}`);
          });
        }
        
        // 显示所有控制台消息（用于调试）
        console.log('📝 控制台消息:');
        consoleMessages.forEach((msg, index) => {
          if (index < 10) { // 只显示前10条消息
            console.log(`  ${index + 1}. ${msg}`);
          }
        });
        
        if (consoleMessages.length > 10) {
          console.log(`  ... 还有 ${consoleMessages.length - 10} 条消息`);
        }
        
        await managerPage.close();
        
        // 总结
        console.log('\n📋 CSP验证总结:');
        console.log(`- 扩展加载: ✅`);
        console.log(`- 页面访问: ✅`);
        console.log(`- CSP违规: ${cspViolations.length === 0 ? '✅ 无' : '❌ ' + cspViolations.length + '个'}`);
        console.log(`- 页面功能: ${pageInfo.hasBody && pageInfo.scriptCount > 0 ? '✅ 正常' : '⚠️ 可能有问题'}`);
        
      } catch (error) {
        console.error('❌ 访问管理界面失败:', error.message);
      }
    } else {
      console.log('❌ 未找到扩展ID，扩展可能加载失败');
    }
    
  } catch (error) {
    console.error('❌ CSP验证测试失败:', error);
  } finally {
    if (context) {
      await context.close();
    }
  }
}

// 运行验证
validateCSP().catch(console.error);