/**
 * 扩展构建脚本
 * 构建项目并自动修复路径问题
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始构建Tabify扩展...');

try {
  // 1. 构建React应用
  console.log('📦 构建React应用...');
  execSync('npm run build', { stdio: 'inherit', cwd: path.join(__dirname, '../apps') });

  // 2. 复制构建文件到extension/build目录
  console.log('📋 复制构建文件...');
  const appsBuildDir = path.join(__dirname, '../apps/.next');
  const extensionBuildDir = path.join(__dirname, '../extension/build');

  // 确保extension/build目录存在
  if (!fs.existsSync(extensionBuildDir)) {
    fs.mkdirSync(extensionBuildDir, { recursive: true });
  }

  // 复制Next.js构建文件
  const nextStaticDir = path.join(appsBuildDir, 'static');
  const targetNextStaticDir = path.join(extensionBuildDir, 'nextstatic');

  if (fs.existsSync(nextStaticDir)) {
    copyDirectory(nextStaticDir, targetNextStaticDir);
    console.log('✅ Next.js静态文件复制完成');
  }

  // 3. 生成HTML文件
  console.log('📄 生成HTML文件...');
  generateHtmlFiles(extensionBuildDir);

  // 4. 复制必要文件
  console.log('📁 复制必要文件...');
  const filesToCopy = [
    '../extension/manifest.json',
    '../extension/background.js',
    '../extension/logo.png'
  ];

  filesToCopy.forEach(file => {
    const source = path.join(__dirname, file);
    const target = path.join(extensionBuildDir, path.basename(file));

    if (fs.existsSync(source)) {
      fs.copyFileSync(source, target);
      console.log(`✅ 复制文件: ${path.basename(file)}`);
    }
  });

  // 5. 复制图标目录
  const iconsDir = path.join(__dirname, '../extension/icons');
  const targetIconsDir = path.join(extensionBuildDir, 'icons');

  if (fs.existsSync(iconsDir)) {
    copyDirectory(iconsDir, targetIconsDir);
    console.log('✅ 图标文件复制完成');
  }

  // 6. 修复路径问题
  console.log('🔧 修复路径问题...');
  execSync('node scripts/fix-build-paths.js', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

  console.log('🎉 扩展构建完成！');
  console.log('📂 构建文件位置: extension/build/');
  console.log('💡 在Chrome中加载: chrome://extensions/ -> 加载已解压的扩展程序 -> 选择extension/build目录');

} catch (error) {
  console.error('❌ 构建失败:', error.message);
  process.exit(1);
}

/**
 * 递归复制目录
 */
function copyDirectory(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const files = fs.readdirSync(source);

  files.forEach(file => {
    const sourcePath = path.join(source, file);
    const targetPath = path.join(target, file);

    if (fs.statSync(sourcePath).isDirectory()) {
      copyDirectory(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  });
}

/**
 * 生成HTML文件
 */
function generateHtmlFiles(buildDir) {
  // 生成manager.html
  const managerHtml = generateManagerHtml();
  fs.writeFileSync(path.join(buildDir, 'manager.html'), managerHtml);

  // 生成settings.html
  const settingsHtml = generateSettingsHtml();
  fs.writeFileSync(path.join(buildDir, 'settings.html'), settingsHtml);

  // 生成import-export.html
  const importExportHtml = generateImportExportHtml();
  fs.writeFileSync(path.join(buildDir, 'import-export.html'), importExportHtml);

  console.log('✅ HTML文件生成完成');
}

/**
 * 生成管理界面HTML
 */
function generateManagerHtml() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Tabify - 标签页管理器</title>
  <meta name="description" content="高效的Chrome浏览器标签页管理插件，提供一键收纳、智能分组、批量操作等功能，显著提升浏览效率和体验。" />
  <link rel="stylesheet" href="nextstatic/static/css/main.css" />
  <!-- Chrome扩展桥梁脚本 -->
  <script src="chrome-extension-bridge.js"></script>
</head>
<body>
  <div id="app">
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p>正在初始化应用...</p>
    </div>
  </div>
  <script src="nextstatic/static/js/main.js"></script>
</body>
</html>`;
}

/**
 * 生成设置页面HTML
 */
function generateSettingsHtml() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Tabify - 设置</title>
  <meta name="description" content="高效的Chrome浏览器标签页管理插件，提供一键收纳、智能分组、批量操作等功能，显著提升浏览效率和体验。" />
  <link rel="stylesheet" href="nextstatic/static/css/main.css" />
  <!-- Chrome扩展桥梁脚本 -->
  <script src="chrome-extension-bridge.js"></script>
</head>
<body>
  <div id="app">
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p>正在初始化设置...</p>
    </div>
  </div>
  <script src="nextstatic/static/js/main.js"></script>
  <script>
    // 页面加载完成后自动跳转到AI设置tab
    if (typeof window !== 'undefined') {
      window.addEventListener('DOMContentLoaded', function() {
        // 设置URL参数为AI设置tab
        if (window.location.search === '') {
          window.history.replaceState({}, '', '?tab=ai');
        }
      });
    }
  </script>
</body>
</html>`;
}

/**
 * 生成导入导出页面HTML
 */
function generateImportExportHtml() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Tabify - 导入导出</title>
  <meta name="description" content="高效的Chrome浏览器标签页管理插件，提供一键收纳、智能分组、批量操作等功能，显著提升浏览效率和体验。" />
  <link rel="stylesheet" href="nextstatic/static/css/main.css" />
  <!-- Chrome扩展桥梁脚本 -->
  <script src="chrome-extension-bridge.js"></script>
</head>
<body>
  <div id="app">
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p>正在初始化导入导出功能...</p>
    </div>
  </div>
  <script src="nextstatic/static/js/main.js"></script>
  <script>
    // 页面加载完成后自动跳转到导入导出页面
    if (typeof window !== 'undefined') {
      window.addEventListener('DOMContentLoaded', function() {
        // 设置URL路径为导入导出页面
        if (window.location.pathname === '/') {
          window.history.replaceState({}, '', '/import-export');
        }
      });
    }
  </script>
</body>
</html>`;
}