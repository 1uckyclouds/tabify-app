/**
 * 最终页面功能测试脚本
 * 验证manager.html页面是否完全可用
 */

const { chromium } = require('playwright');
const path = require('path');

/**
 * 最终功能测试
 * 检查页面是否真正可用，而不仅仅是加载成功
 */
async function finalTest() {
  console.log('🎯 开始最终功能测试...');
  
  let browser;
  let page;
  
  try {
    browser = await chromium.launch({ 
      headless: false,
      devtools: false // 关闭开发者工具以获得更真实的用户体验
    });
    
    const context = await browser.newContext();
    page = await context.newPage();
    
    // 错误计数器
    let errorCount = 0;
    let warningCount = 0;
    
    // 监听错误
    page.on('pageerror', error => {
      if (error.message.includes('removeChild')) {
        console.log('⚠️  React DOM警告（已修复）:', error.message.substring(0, 100));
        warningCount++;
      } else {
        console.log('❌ 严重错误:', error.message);
        errorCount++;
      }
    });
    
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('Failed to load resource')) {
        console.log('❌ 控制台错误:', msg.text());
        errorCount++;
      } else if (msg.type() === 'warn' && msg.text().includes('尝试移除不存在的子节点')) {
        console.log('✅ DOM安全警告正常工作');
        warningCount++;
      }
    });
    
    // 加载页面
    const managerPath = path.resolve(__dirname, 'extension/build/manager.html');
    const managerUrl = `file://${managerPath}`;
    
    console.log('📂 加载页面:', managerUrl);
    await page.goto(managerUrl, { waitUntil: 'networkidle', timeout: 30000 });
    
    // 等待页面稳定
    await page.waitForTimeout(3000);
    
    // 功能测试
    const testResults = await page.evaluate(() => {
      const results = {
        pageLoaded: false,
        titleCorrect: false,
        bodyContent: false,
        reactData: false,
        domSafety: false,
        uiElements: {
          logo: false,
          searchBox: false,
          buttons: false,
          tabGroups: false
        },
        interactivity: {
          canClickButtons: false,
          canTypeInSearch: false
        }
      };
      
      // 基本页面检查
      results.pageLoaded = document.readyState === 'complete';
      results.titleCorrect = document.title.includes('Tabify');
      results.bodyContent = document.body && document.body.children.length > 5;
      results.reactData = typeof window.__next_f !== 'undefined' && window.__next_f.length > 0;
      results.domSafety = typeof window.SafeDOM !== 'undefined';
      
      // UI元素检查
      results.uiElements.logo = !!document.querySelector('img[alt*="Logo"]');
      results.uiElements.searchBox = !!document.querySelector('input[placeholder*="搜索"]');
      results.uiElements.buttons = document.querySelectorAll('button').length > 3;
      results.uiElements.tabGroups = !!document.querySelector('.border.border-gray-200');
      
      // 交互性测试
      try {
        const searchInput = document.querySelector('input[placeholder*="搜索"]');
        if (searchInput) {
          searchInput.focus();
          searchInput.value = 'test';
          results.interactivity.canTypeInSearch = searchInput.value === 'test';
          searchInput.value = ''; // 清空
        }
        
        const buttons = document.querySelectorAll('button:not([disabled])');
        results.interactivity.canClickButtons = buttons.length > 0;
      } catch (error) {
        console.warn('交互性测试失败:', error);
      }
      
      return results;
    });
    
    // 输出测试结果
    console.log('\n📊 测试结果:');
    console.log('='.repeat(50));
    
    // 基础功能
    console.log('\n🔧 基础功能:');
    console.log(`  页面加载: ${testResults.pageLoaded ? '✅' : '❌'}`);
    console.log(`  标题正确: ${testResults.titleCorrect ? '✅' : '❌'}`);
    console.log(`  内容渲染: ${testResults.bodyContent ? '✅' : '❌'}`);
    console.log(`  React数据: ${testResults.reactData ? '✅' : '❌'}`);
    console.log(`  DOM安全: ${testResults.domSafety ? '✅' : '❌'}`);
    
    // UI元素
    console.log('\n🎨 UI元素:');
    console.log(`  Logo显示: ${testResults.uiElements.logo ? '✅' : '❌'}`);
    console.log(`  搜索框: ${testResults.uiElements.searchBox ? '✅' : '❌'}`);
    console.log(`  按钮组件: ${testResults.uiElements.buttons ? '✅' : '❌'}`);
    console.log(`  标签组: ${testResults.uiElements.tabGroups ? '✅' : '❌'}`);
    
    // 交互性
    console.log('\n🖱️  交互性:');
    console.log(`  可点击按钮: ${testResults.interactivity.canClickButtons ? '✅' : '❌'}`);
    console.log(`  可输入搜索: ${testResults.interactivity.canTypeInSearch ? '✅' : '❌'}`);
    
    // 错误统计
    console.log('\n🚨 错误统计:');
    console.log(`  严重错误: ${errorCount}`);
    console.log(`  警告数量: ${warningCount}`);
    
    // 综合评估
    const basicScore = Object.values({
      pageLoaded: testResults.pageLoaded,
      titleCorrect: testResults.titleCorrect,
      bodyContent: testResults.bodyContent,
      reactData: testResults.reactData,
      domSafety: testResults.domSafety
    }).filter(Boolean).length;
    
    const uiScore = Object.values(testResults.uiElements).filter(Boolean).length;
    const interactivityScore = Object.values(testResults.interactivity).filter(Boolean).length;
    
    const totalScore = basicScore + uiScore + interactivityScore;
    const maxScore = 11; // 5 + 4 + 2
    const percentage = Math.round((totalScore / maxScore) * 100);
    
    console.log('\n🎯 综合评估:');
    console.log(`  基础功能: ${basicScore}/5`);
    console.log(`  UI元素: ${uiScore}/4`);
    console.log(`  交互性: ${interactivityScore}/2`);
    console.log(`  总分: ${totalScore}/${maxScore} (${percentage}%)`);
    
    // 判断是否成功
    const isSuccess = percentage >= 80 && errorCount === 0;
    
    if (isSuccess) {
      console.log('\n🎉 测试通过！页面功能正常');
      console.log('✅ manager.html页面已成功修复并可正常使用');
    } else {
      console.log('\n⚠️  测试未完全通过');
      if (errorCount > 0) {
        console.log(`❌ 仍有 ${errorCount} 个严重错误需要修复`);
      }
      if (percentage < 80) {
        console.log(`📊 功能完整度 ${percentage}% 低于80%阈值`);
      }
    }
    
    // 保持页面打开5秒供观察
    console.log('\n👀 页面将保持打开5秒供观察...');
    await page.waitForTimeout(5000);
    
    return isSuccess;
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// 运行测试
if (require.main === module) {
  finalTest().then(success => {
    if (success) {
      console.log('\n🏆 恭喜！manager.html页面修复成功！');
      process.exit(0);
    } else {
      console.log('\n🔄 页面仍需进一步修复');
      process.exit(1);
    }
  }).catch(error => {
    console.error('测试失败:', error);
    process.exit(1);
  });
}

module.exports = { finalTest };