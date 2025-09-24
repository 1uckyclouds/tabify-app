/**
 * 测试报告查看器
 * 直接打开本地HTML测试报告，无需启动服务器
 * 
 * 功能特性：
 * - 自动检测并打开最新的测试报告
 * - 显示测试统计信息（通过/失败/跳过）
 * - 列出失败测试的错误信息
 * - 显示截图文件列表
 * - 跨平台浏览器打开支持
 * - 友好的命令行界面
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');

/**
 * 配置常量
 */
const CONFIG = {
  // HTML报告路径
  HTML_REPORT_PATH: path.resolve('./test-results/html-report/index.html'),
  
  // JSON报告路径
  JSON_REPORT_PATH: path.resolve('./test-results/results.json'),
  
  // 截图目录
  SCREENSHOTS_PATH: path.resolve('./test-results/screenshots'),
  
  // Playwright报告路径
  PLAYWRIGHT_REPORT_PATH: path.resolve('./playwright-report/index.html')
};

/**
 * 检查文件是否存在
 * @param {string} filePath - 文件路径
 * @returns {boolean} 文件是否存在
 */
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

/**
 * 获取文件修改时间
 * @param {string} filePath - 文件路径
 * @returns {Date|null} 修改时间
 */
function getFileModTime(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.mtime;
  } catch (error) {
    return null;
  }
}

/**
 * 在默认浏览器中打开文件
 * @param {string} filePath - 文件路径
 */
function openInBrowser(filePath) {
  const platform = os.platform();
  let command;
  
  switch (platform) {
    case 'darwin': // macOS
      command = `open "${filePath}"`;
      break;
    case 'win32': // Windows
      command = `start "" "${filePath}"`;
      break;
    default: // Linux
      command = `xdg-open "${filePath}"`;
      break;
  }
  
  exec(command, (error) => {
    if (error) {
      console.error('❌ 打开浏览器失败:', error.message);
      console.log('📋 请手动打开以下文件:');
      console.log(`   ${filePath}`);
    } else {
      console.log('✅ 已在浏览器中打开测试报告');
    }
  });
}

/**
 * 显示测试报告摘要
 */
function showTestSummary() {
  console.log('\n📊 测试报告摘要:');
  console.log('='.repeat(50));
  
  // 检查JSON报告
  if (fileExists(CONFIG.JSON_REPORT_PATH)) {
    try {
      const jsonReport = JSON.parse(fs.readFileSync(CONFIG.JSON_REPORT_PATH, 'utf8'));
      const modTime = getFileModTime(CONFIG.JSON_REPORT_PATH);
      
      console.log(`📅 报告生成时间: ${modTime ? modTime.toLocaleString() : '未知'}`);
      
      // 统计测试结果
      let totalTests = 0;
      let passedTests = 0;
      let failedTests = 0;
      let skippedTests = 0;
      
      if (jsonReport.suites) {
        jsonReport.suites.forEach(suite => {
          if (suite.suites) {
            suite.suites.forEach(subSuite => {
              if (subSuite.specs) {
                subSuite.specs.forEach(spec => {
                  totalTests++;
                  if (spec.ok === true) {
                    passedTests++;
                  } else if (spec.ok === false) {
                    failedTests++;
                  } else {
                    skippedTests++;
                  }
                });
              }
            });
          }
        });
      }
      
      console.log(`📈 测试总数: ${totalTests}`);
      console.log(`✅ 通过: ${passedTests}`);
      console.log(`❌ 失败: ${failedTests}`);
      console.log(`⏭️  跳过: ${skippedTests}`);
      
      if (failedTests > 0) {
        console.log('\n❌ 失败的测试:');
        jsonReport.suites.forEach(suite => {
          if (suite.suites) {
            suite.suites.forEach(subSuite => {
              if (subSuite.specs) {
                subSuite.specs.forEach(spec => {
                  if (spec.ok === false) {
                    console.log(`   - ${spec.title}`);
                    if (spec.tests && spec.tests[0] && spec.tests[0].results && spec.tests[0].results[0]) {
                      const result = spec.tests[0].results[0];
                      if (result.error && result.error.message) {
                        console.log(`     错误: ${result.error.message.replace(/\u001b\[[0-9;]*m/g, '')}`);
                      }
                    }
                  }
                });
              }
            });
          }
        });
      }
      
    } catch (error) {
      console.log('⚠️ 无法解析JSON报告:', error.message);
    }
  } else {
    console.log('⚠️ 未找到JSON报告文件');
  }
  
  // 检查截图
  if (fileExists(CONFIG.SCREENSHOTS_PATH)) {
    try {
      const screenshots = fs.readdirSync(CONFIG.SCREENSHOTS_PATH)
        .filter(file => file.endsWith('.png'));
      console.log(`📸 截图数量: ${screenshots.length}`);
      if (screenshots.length > 0) {
        console.log('   截图文件:');
        screenshots.forEach(screenshot => {
          console.log(`   - ${screenshot}`);
        });
      }
    } catch (error) {
      console.log('⚠️ 无法读取截图目录');
    }
  }
  
  console.log('='.repeat(50));
}

/**
 * 主函数
 */
function main() {
  console.log('🔍 Tabify Chrome扩展测试报告查看器');
  console.log('='.repeat(50));
  
  // 显示测试摘要
  showTestSummary();
  
  // 查找可用的报告文件
  const reportFiles = [
    { path: CONFIG.HTML_REPORT_PATH, name: 'HTML测试报告' },
    { path: CONFIG.PLAYWRIGHT_REPORT_PATH, name: 'Playwright报告' }
  ];
  
  let foundReport = false;
  
  for (const report of reportFiles) {
    if (fileExists(report.path)) {
      console.log(`\n✅ 找到${report.name}: ${report.path}`);
      const modTime = getFileModTime(report.path);
      if (modTime) {
        console.log(`📅 修改时间: ${modTime.toLocaleString()}`);
      }
      
      if (!foundReport) {
        console.log('🌐 正在打开报告...');
        openInBrowser(report.path);
        foundReport = true;
      }
    }
  }
  
  if (!foundReport) {
    console.log('\n❌ 未找到测试报告文件');
    console.log('💡 请先运行测试: npm test 或 npx playwright test');
    console.log('\n📁 预期的报告文件位置:');
    reportFiles.forEach(report => {
      console.log(`   - ${report.path}`);
    });
  } else {
    console.log('\n💡 提示:');
    console.log('   - 测试报告已在浏览器中打开');
    console.log('   - 如需重新运行测试: npm test');
    console.log('   - 如需查看详细日志: node view-test-report.js');
  }
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = {
  openTestReport: main,
  showTestSummary,
  CONFIG
};