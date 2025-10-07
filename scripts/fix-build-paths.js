/**
 * 修复build目录中的路径问题
 * 在构建完成后自动运行，修复相对路径问题
 */

const fs = require('fs');
const path = require('path');

const buildDir = path.join(__dirname, '../extension/build');
const backgroundJsPath = path.join(buildDir, 'background.js');

console.log('🔧 开始修复build目录中的路径问题...');

if (fs.existsSync(backgroundJsPath)) {
  let content = fs.readFileSync(backgroundJsPath, 'utf8');

  // 修复manager.html的路径
  content = content.replace(
    /chrome\.runtime\.getURL\('build\/manager\.html'\)/g,
    "chrome.runtime.getURL('manager.html')"
  );

  fs.writeFileSync(backgroundJsPath, content);
  console.log('✅ background.js路径修复完成');
} else {
  console.log('❌ background.js文件不存在，请先构建项目');
}

console.log('🎉 路径修复完成！');