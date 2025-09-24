/**
 * 拖拽功能自动化测试脚本
 * 
 * 本脚本使用Playwright进行自动化测试，替代手动测试拖拽功能
 * 测试内容包括：拖拽图标显示、拖拽排序、跨分组移动、视觉反馈等
 * 
 * @author AI Assistant
 * @date 2025-01-25
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

/**
 * 测试配置
 */
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3001',
  timeout: 30000,
  viewport: { width: 1280, height: 720 },
  screenshotDir: './test-screenshots',
  reportFile: './test-results/drag-test-report.json'
};

/**
 * 测试结果收集器
 */
class TestReporter {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      testSuite: '拖拽功能自动化测试',
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      tests: []
    };
  }

  /**
   * 添加测试结果
   * @param {string} testName - 测试名称
   * @param {boolean} passed - 是否通过
   * @param {string} description - 测试描述
   * @param {string} error - 错误信息（如果有）
   * @param {string} screenshot - 截图路径（如果有）
   */
  addTest(testName, passed, description, error = null, screenshot = null) {
    this.results.totalTests++;
    if (passed) {
      this.results.passedTests++;
    } else {
      this.results.failedTests++;
    }

    this.results.tests.push({
      name: testName,
      passed,
      description,
      error,
      screenshot,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 生成测试报告
   */
  generateReport() {
    const reportDir = path.dirname(TEST_CONFIG.reportFile);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(TEST_CONFIG.reportFile, JSON.stringify(this.results, null, 2));
    
    // 生成简化的控制台报告
    console.log('\n=== 拖拽功能测试报告 ===');
    console.log(`测试时间: ${this.results.timestamp}`);
    console.log(`总测试数: ${this.results.totalTests}`);
    console.log(`通过: ${this.results.passedTests}`);
    console.log(`失败: ${this.results.failedTests}`);
    console.log(`成功率: ${((this.results.passedTests / this.results.totalTests) * 100).toFixed(2)}%`);
    
    if (this.results.failedTests > 0) {
      console.log('\n失败的测试:');
      this.results.tests.filter(t => !t.passed).forEach(test => {
        console.log(`- ${test.name}: ${test.error}`);
      });
    }
    
    console.log(`\n详细报告已保存到: ${TEST_CONFIG.reportFile}`);
  }
}

/**
 * 拖拽功能测试类
 */
class DragFunctionTest {
  constructor() {
    this.browser = null;
    this.page = null;
    this.reporter = new TestReporter();
  }

  /**
   * 初始化测试环境
   */
  async setup() {
    console.log('正在启动浏览器...');
    this.browser = await chromium.launch({ 
      headless: false, // 设置为false以便观察测试过程
      slowMo: 100 // 减慢操作速度以便观察
    });
    
    this.page = await this.browser.newPage();
    await this.page.setViewportSize(TEST_CONFIG.viewport);
    
    // 创建截图目录
    if (!fs.existsSync(TEST_CONFIG.screenshotDir)) {
      fs.mkdirSync(TEST_CONFIG.screenshotDir, { recursive: true });
    }
  }

  /**
   * 清理测试环境
   */
  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  /**
   * 截图辅助函数
   * @param {string} name - 截图名称
   */
  async takeScreenshot(name) {
    const screenshotPath = path.join(TEST_CONFIG.screenshotDir, `${name}-${Date.now()}.png`);
    await this.page.screenshot({ path: screenshotPath });
    return screenshotPath;
  }

  /**
   * 等待页面加载完成
   */
  async waitForPageLoad() {
    console.log('等待页面加载...');
    await this.page.goto(TEST_CONFIG.baseUrl);
    await this.page.waitForLoadState('networkidle');
    
    // 等待React组件渲染完成
    await this.page.waitForSelector('[data-testid="tab-item"], .sortable-item', { timeout: 10000 });
    await this.page.waitForTimeout(2000); // 额外等待确保所有组件都已渲染
  }

  /**
   * 测试1: 验证拖拽图标悬停显示
   */
  async testDragIconHoverDisplay() {
    console.log('测试1: 拖拽图标悬停显示');
    
    try {
      // 查找第一个标签页项目
      const tabItem = await this.page.locator('.sortable-item').first();
      await tabItem.waitFor({ state: 'visible' });
      
      // 截图：悬停前
      const beforeHoverScreenshot = await this.takeScreenshot('drag-icon-before-hover');
      
      // 悬停在标签页上
      await tabItem.hover();
      await this.page.waitForTimeout(500); // 等待悬停效果
      
      // 截图：悬停后
      const afterHoverScreenshot = await this.takeScreenshot('drag-icon-after-hover');
      
      // 检查拖拽图标是否显示
      const dragIcon = tabItem.locator('[title="拖拽移动标签页"]');
      const isVisible = await dragIcon.isVisible();
      
      this.reporter.addTest(
        '拖拽图标悬停显示',
        isVisible,
        '验证鼠标悬停时拖拽图标是否正确显示',
        isVisible ? null : '拖拽图标在悬停时未显示',
        afterHoverScreenshot
      );
      
      console.log(`✓ 拖拽图标悬停显示: ${isVisible ? '通过' : '失败'}`);
      
    } catch (error) {
      const errorScreenshot = await this.takeScreenshot('drag-icon-hover-error');
      this.reporter.addTest(
        '拖拽图标悬停显示',
        false,
        '验证鼠标悬停时拖拽图标是否正确显示',
        error.message,
        errorScreenshot
      );
      console.log(`✗ 拖拽图标悬停显示测试失败: ${error.message}`);
    }
  }

  /**
   * 测试2: 同一分组内拖拽排序
   */
  async testIntraGroupDragSort() {
    console.log('测试2: 同一分组内拖拽排序');
    
    try {
      // 获取第一个分组中的标签页
      const tabItems = await this.page.locator('.sortable-item').all();
      
      if (tabItems.length < 2) {
        throw new Error('需要至少2个标签页来测试拖拽排序');
      }
      
      // 获取拖拽前的标签页标题
      const firstTabTitle = await tabItems[0].locator('.text-sm.font-medium').textContent();
      const secondTabTitle = await tabItems[1].locator('.text-sm.font-medium').textContent();
      
      console.log(`拖拽前顺序: 1.${firstTabTitle} 2.${secondTabTitle}`);
      
      // 截图：拖拽前
      const beforeDragScreenshot = await this.takeScreenshot('intra-group-before-drag');
      
      // 执行拖拽操作：将第一个标签页拖拽到第二个标签页的位置
      const firstTabBounds = await tabItems[0].boundingBox();
      const secondTabBounds = await tabItems[1].boundingBox();
      
      if (!firstTabBounds || !secondTabBounds) {
        throw new Error('无法获取标签页位置信息');
      }
      
      // 悬停并开始拖拽
      await tabItems[0].hover();
      await this.page.waitForTimeout(300);
      
      // 执行拖拽
      await this.page.mouse.move(
        firstTabBounds.x + firstTabBounds.width / 2,
        firstTabBounds.y + firstTabBounds.height / 2
      );
      await this.page.mouse.down();
      await this.page.waitForTimeout(200);
      
      await this.page.mouse.move(
        secondTabBounds.x + secondTabBounds.width / 2,
        secondTabBounds.y + secondTabBounds.height / 2,
        { steps: 10 }
      );
      await this.page.waitForTimeout(300);
      await this.page.mouse.up();
      
      // 等待拖拽完成
      await this.page.waitForTimeout(1000);
      
      // 截图：拖拽后
      const afterDragScreenshot = await this.takeScreenshot('intra-group-after-drag');
      
      // 验证拖拽结果
      const updatedTabItems = await this.page.locator('.sortable-item').all();
      const newFirstTabTitle = await updatedTabItems[0].locator('.text-sm.font-medium').textContent();
      const newSecondTabTitle = await updatedTabItems[1].locator('.text-sm.font-medium').textContent();
      
      console.log(`拖拽后顺序: 1.${newFirstTabTitle} 2.${newSecondTabTitle}`);
      
      // 检查是否发生了位置交换
      const dragSuccess = (newFirstTabTitle === secondTabTitle && newSecondTabTitle === firstTabTitle) ||
                         (newFirstTabTitle !== firstTabTitle); // 至少发生了变化
      
      this.reporter.addTest(
        '同一分组内拖拽排序',
        dragSuccess,
        '验证标签页在同一分组内的拖拽排序功能',
        dragSuccess ? null : '拖拽后标签页顺序未发生预期变化',
        afterDragScreenshot
      );
      
      console.log(`✓ 同一分组内拖拽排序: ${dragSuccess ? '通过' : '失败'}`);
      
    } catch (error) {
      const errorScreenshot = await this.takeScreenshot('intra-group-drag-error');
      this.reporter.addTest(
        '同一分组内拖拽排序',
        false,
        '验证标签页在同一分组内的拖拽排序功能',
        error.message,
        errorScreenshot
      );
      console.log(`✗ 同一分组内拖拽排序测试失败: ${error.message}`);
    }
  }

  /**
   * 测试3: 检查JavaScript错误
   */
  async testJavaScriptErrors() {
    console.log('测试3: JavaScript错误检查');
    
    const errors = [];
    
    // 监听页面错误
    this.page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    // 监听控制台错误
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // 执行一些基本操作来触发可能的错误
    try {
      await this.page.reload();
      await this.waitForPageLoad();
      
      // 模拟一些用户交互
      const tabItem = await this.page.locator('.sortable-item').first();
      if (await tabItem.isVisible()) {
        await tabItem.hover();
        await this.page.waitForTimeout(500);
      }
      
      // 检查搜索功能
      const searchInput = await this.page.locator('input[placeholder*="搜索"]');
      if (await searchInput.isVisible()) {
        await searchInput.fill('test');
        await this.page.waitForTimeout(500);
        await searchInput.clear();
      }
      
      await this.page.waitForTimeout(2000);
      
      const hasErrors = errors.length > 0;
      const errorMessage = hasErrors ? `发现${errors.length}个错误: ${errors.join('; ')}` : null;
      
      this.reporter.addTest(
        'JavaScript错误检查',
        !hasErrors,
        '检查页面是否存在JavaScript错误',
        errorMessage
      );
      
      console.log(`✓ JavaScript错误检查: ${!hasErrors ? '通过' : '失败'}`);
      
      if (hasErrors) {
        console.log('发现的错误:');
        errors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error}`);
        });
      }
      
    } catch (error) {
      this.reporter.addTest(
        'JavaScript错误检查',
        false,
        '检查页面是否存在JavaScript错误',
        `测试执行失败: ${error.message}`
      );
      console.log(`✗ JavaScript错误检查测试失败: ${error.message}`);
    }
  }

  /**
   * 测试4: 拖拽状态管理验证
   */
  async testDragStateManagement() {
    console.log('测试4: 拖拽状态管理验证');
    
    try {
      const tabItem = await this.page.locator('.sortable-item').first();
      await tabItem.waitFor({ state: 'visible' });
      
      // 悬停触发拖拽图标显示
      await tabItem.hover();
      await this.page.waitForTimeout(300);
      
      // 检查拖拽开始状态
      const tabBounds = await tabItem.boundingBox();
      if (!tabBounds) {
        throw new Error('无法获取标签页位置');
      }
      
      // 开始拖拽
      await this.page.mouse.move(
        tabBounds.x + tabBounds.width / 2,
        tabBounds.y + tabBounds.height / 2
      );
      await this.page.mouse.down();
      await this.page.waitForTimeout(200);
      
      // 检查拖拽状态类名
      const isDragging = await tabItem.evaluate(el => {
        return el.classList.contains('dragging') || 
               el.classList.contains('drag-start') ||
               el.style.opacity !== '1';
      });
      
      // 移动鼠标
      await this.page.mouse.move(
        tabBounds.x + tabBounds.width / 2,
        tabBounds.y + tabBounds.height / 2 + 50,
        { steps: 5 }
      );
      await this.page.waitForTimeout(200);
      
      // 结束拖拽
      await this.page.mouse.up();
      await this.page.waitForTimeout(500);
      
      // 检查拖拽结束后状态恢复
      const isNormalState = await tabItem.evaluate(el => {
        return !el.classList.contains('dragging') && 
               !el.classList.contains('drag-start');
      });
      
      const stateManagementWorking = isDragging && isNormalState;
      
      this.reporter.addTest(
        '拖拽状态管理验证',
        stateManagementWorking,
        '验证拖拽过程中状态管理是否正常',
        stateManagementWorking ? null : '拖拽状态管理异常'
      );
      
      console.log(`✓ 拖拽状态管理验证: ${stateManagementWorking ? '通过' : '失败'}`);
      
    } catch (error) {
      const errorScreenshot = await this.takeScreenshot('drag-state-error');
      this.reporter.addTest(
        '拖拽状态管理验证',
        false,
        '验证拖拽过程中状态管理是否正常',
        error.message,
        errorScreenshot
      );
      console.log(`✗ 拖拽状态管理验证测试失败: ${error.message}`);
    }
  }

  /**
   * 运行所有测试
   */
  async runAllTests() {
    console.log('开始拖拽功能自动化测试...');
    
    try {
      await this.setup();
      await this.waitForPageLoad();
      
      // 执行所有测试
      await this.testDragIconHoverDisplay();
      await this.testIntraGroupDragSort();
      await this.testJavaScriptErrors();
      await this.testDragStateManagement();
      
      // 生成测试报告
      this.reporter.generateReport();
      
    } catch (error) {
      console.error('测试执行失败:', error);
    } finally {
      await this.cleanup();
    }
  }
}

/**
 * 主函数
 */
async function main() {
  const tester = new DragFunctionTest();
  await tester.runAllTests();
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { DragFunctionTest, TestReporter };