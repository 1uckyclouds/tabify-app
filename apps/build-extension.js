/**
 * Chrome扩展构建脚本
 * 
 * 本脚本负责将Next.js React应用构建为Chrome扩展兼容的格式：
 * 1. 构建静态文件
 * 2. 复制必要的资源文件
 * 3. 生成扩展兼容的HTML文件
 * 4. 处理路径和资源引用
 * 5. 创建完整的扩展包
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 配置常量
const CONFIG = {
  // 源目录
  SOURCE_DIR: __dirname,
  // 输出目录
  OUTPUT_DIR: path.join(__dirname, 'out'),
  // 扩展目录
  EXTENSION_DIR: path.join(__dirname, '..', 'extension'),
  // 构建输出目录
  BUILD_OUTPUT: path.join(__dirname, '..', 'extension', 'build'),
  // 静态资源目录
  STATIC_DIR: path.join(__dirname, 'out', '_next', 'static'),
  // Chrome兼容的静态文件夹名称（替代_next）
  CHROME_STATIC_DIR: 'nextstatic',
};

/**
 * 主构建函数
 * 执行完整的Chrome扩展构建流程
 */
async function buildExtension() {
  console.log('🚀 开始构建Chrome扩展...');
  
  try {
    // 步骤1: 清理输出目录
    await cleanOutputDirectory();
    
    // 步骤2: 构建Next.js应用
    await buildNextApp();
    
    // 步骤3: 创建扩展构建目录
    await createExtensionBuildDir();
    
    // 步骤4: 复制静态文件
    await copyStaticFiles();
    
    // 步骤5: 生成扩展兼容的HTML
    await generateExtensionHTML();
    
    // 步骤6: 处理CSS和JS文件
    await processAssets();
    
    // 步骤7: 复制扩展文件
    await copyExtensionFiles();
    
    // 步骤8: 验证构建结果
    await validateBuild();

    // 步骤9: 后置JS语法校验
    await validateJavaScriptSyntax();
    
    console.log('✅ Chrome扩展构建完成!');
    console.log(`📦 构建输出: ${CONFIG.BUILD_OUTPUT}`);
    
  } catch (error) {
    console.error('❌ 构建失败:', error.message);
    process.exit(1);
  }
}

/**
 * 清理输出目录
 * 删除之前的构建文件，确保干净的构建环境
 */
async function cleanOutputDirectory() {
  console.log('🧹 清理输出目录...');
  
  // 删除Next.js输出目录
  if (fs.existsSync(CONFIG.OUTPUT_DIR)) {
    fs.rmSync(CONFIG.OUTPUT_DIR, { recursive: true, force: true });
  }
  
  // 删除扩展构建目录
  if (fs.existsSync(CONFIG.BUILD_OUTPUT)) {
    fs.rmSync(CONFIG.BUILD_OUTPUT, { recursive: true, force: true });
  }
  
  console.log('✅ 输出目录清理完成');
}

/**
 * 构建Next.js应用
 * 使用Next.js的静态导出功能生成静态文件
 */
async function buildNextApp() {
  console.log('🔨 构建Next.js应用...');
  
  try {
    // 执行Next.js构建
    console.log('🔧 执行命令: npm run build');
    console.log('📁 工作目录:', CONFIG.SOURCE_DIR);
    
    execSync('npm run build', {
      cwd: CONFIG.SOURCE_DIR,
      stdio: 'inherit'
    });

    // 检查输出目录是否生成（Next.js 15使用output: export自动生成）
    if (fs.existsSync(CONFIG.OUTPUT_DIR)) {
      console.log('✅ Next.js应用构建与静态导出完成，输出目录已生成');
    } else {
      console.warn('⚠️ 静态导出完成但未找到输出目录');
    }
  } catch (error) {
    console.warn(`⚠️ Next.js构建失败: ${error.message}`);
    console.log('📝 将使用HTML模板继续构建扩展...');
    // 不抛出错误，继续执行后续步骤
  }
}

/**
 * 创建扩展构建目录
 * 创建用于存放扩展文件的目录结构
 */
async function createExtensionBuildDir() {
  console.log('📁 创建扩展构建目录...');
  
  // 创建主构建目录
  if (!fs.existsSync(CONFIG.BUILD_OUTPUT)) {
    fs.mkdirSync(CONFIG.BUILD_OUTPUT, { recursive: true });
  }
  
  // 创建子目录（使用Chrome兼容的文件夹名称）
  const subDirs = [CONFIG.CHROME_STATIC_DIR, 'assets', 'icons'];
  subDirs.forEach(dir => {
    const dirPath = path.join(CONFIG.BUILD_OUTPUT, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
  
  console.log('✅ 扩展构建目录创建完成');
}

/**
 * 复制静态文件
 * 将Next.js生成的静态文件复制到扩展目录
 */
async function copyStaticFiles() {
  console.log('📋 复制静态文件...');
  
  try {
    // 复制_next目录到Chrome兼容的文件夹名称
    const nextDir = path.join(CONFIG.OUTPUT_DIR, '_next');
    const targetNextDir = path.join(CONFIG.BUILD_OUTPUT, CONFIG.CHROME_STATIC_DIR);
    
    if (fs.existsSync(nextDir)) {
      copyDirectory(nextDir, targetNextDir);
      console.log(`✅ 已将_next目录重命名为${CONFIG.CHROME_STATIC_DIR}以兼容Chrome扩展`);
    }
    
    // 复制其他静态资源
    const staticFiles = ['logo.png'];
    staticFiles.forEach(file => {
      const sourcePath = path.join(CONFIG.OUTPUT_DIR, file);
      const targetPath = path.join(CONFIG.BUILD_OUTPUT, file);
      
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, targetPath);
      }
    });
    
    console.log('✅ 静态文件复制完成');
  } catch (error) {
    throw new Error(`静态文件复制失败: ${error.message}`);
  }
}

/**
 * 生成扩展兼容的HTML文件
 * 直接使用Next.js构建输出的index.html文件，并转换为Chrome扩展兼容格式
 */
async function generateExtensionHTML() {
  console.log('📄 生成扩展HTML文件...');

  try {
    // 首先尝试使用Next.js构建输出的index.html
    const nextIndexPath = path.join(CONFIG.OUTPUT_DIR, 'index.html');
    const targetManagerPath = path.join(CONFIG.BUILD_OUTPUT, 'manager.html');

    if (fs.existsSync(nextIndexPath)) {
      // 读取Next.js生成的index.html
      let htmlContent = fs.readFileSync(nextIndexPath, 'utf8');

      // 处理HTML内容，使其兼容Chrome扩展
      htmlContent = processHTMLForExtension(htmlContent);

      // 写入manager.html
      fs.writeFileSync(targetManagerPath, htmlContent, 'utf8');
      console.log('✅ 已将Next.js构建的index.html转换为manager.html');

      // 生成其他独立页面
      await generateAdditionalPages();
    } else {
      // 如果没有找到Next.js输出，使用模板生成
      console.warn('⚠️ 未找到Next.js构建输出，使用HTML模板');

      // 创建必要的外部CSS和JS文件
      createTemplateAssets();

      const htmlTemplate = generateHTMLTemplate();
      fs.writeFileSync(targetManagerPath, htmlTemplate, 'utf8');
      console.log('✅ 已使用HTML模板生成manager.html');
    }

    console.log('✅ 扩展HTML文件生成完成');
  } catch (error) {
    throw new Error(`HTML文件生成失败: ${error.message}`);
  }
}

/**
 * 生成额外的独立页面
 * 根据菜单需求生成settings.html等独立页面
 */
async function generateAdditionalPages() {
  console.log('📄 生成额外的独立页面...');

  try {
    // 读取manager.html作为模板
    const managerPath = path.join(CONFIG.BUILD_OUTPUT, 'manager.html');
    const managerContent = fs.readFileSync(managerPath, 'utf8');

    // 生成settings.html
    await generateSettingsPage(managerContent);

    // 生成import-export.html
    await generateImportExportPage(managerContent);

    console.log('✅ 额外页面生成完成');
  } catch (error) {
    console.warn(`⚠️ 额外页面生成失败: ${error.message}`);
  }
}

/**
 * 生成settings.html页面
 */
async function generateSettingsPage(baseHtmlContent) {
  const targetPath = path.join(CONFIG.BUILD_OUTPUT, 'settings.html');

  // 修改页面标题和基础路径
  let settingsContent = baseHtmlContent.replace(
    '<title>Tabify - 标签页管理器</title>',
    '<title>Tabify - 设置</title>'
  );

  // 添加页面初始化脚本，设置默认tab为ai设置
  const initScript = `
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
  `;

  settingsContent = settingsContent.replace('</body>', initScript + '</body>');

  fs.writeFileSync(targetPath, settingsContent, 'utf8');
  console.log('✅ 已生成settings.html');
}

/**
 * 生成import-export.html页面
 */
async function generateImportExportPage(baseHtmlContent) {
  const targetPath = path.join(CONFIG.BUILD_OUTPUT, 'import-export.html');

  // 修改页面标题
  let importExportContent = baseHtmlContent.replace(
    '<title>Tabify - 标签页管理器</title>',
    '<title>Tabify - 导入导出</title>'
  );

  // 添加页面初始化脚本，设置默认路由为导入导出页面
  const initScript = `
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
  `;

  importExportContent = importExportContent.replace('</body>', initScript + '</body>');

  fs.writeFileSync(targetPath, importExportContent, 'utf8');
  console.log('✅ 已生成import-export.html');
}

/**
 * 创建模板所需的外部资源文件
 * 当使用HTML模板时，创建对应的CSS和JS文件
 */
function createTemplateAssets() {
  console.log('📁 创建模板资源文件...');
  
  const buildDir = CONFIG.BUILD_OUTPUT;
  
  // 创建manager-styles.css文件
  const cssContent = `body {
  margin: 0;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #f5f5f5;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.logo {
  width: 48px;
  height: 48px;
}

.title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007acc;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  background: #fee;
  border: 1px solid #fcc;
  color: #c33;
  padding: 15px;
  border-radius: 4px;
  margin: 20px 0;
}
`;
  
  const cssPath = path.join(buildDir, 'manager-styles.css');
  fs.writeFileSync(cssPath, cssContent, 'utf8');
  console.log('✅ 已创建manager-styles.css');
  
  // 创建manager-init.js文件
  const jsContent = `// 基础错误处理
window.onerror = function(msg, url, line, col, error) {
  console.error('页面错误:', msg, 'at', url + ':' + line);
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error';
  errorDiv.innerHTML = '<strong>加载错误:</strong> ' + msg;
  document.getElementById('__next').appendChild(errorDiv);
};

// 检测是否运行在Chrome扩展环境
function isChromeExtension() {
  return typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.getURL === 'function';
}

// 环境配置（兼容非扩展预览）
window.TABIFY_CONFIG = {
  isExtension: isChromeExtension(),
  version: '1.0.0',
  apiEndpoint: isChromeExtension() ? chrome.runtime.getURL('') : '/',
  storageType: isChromeExtension() ? 'chrome' : 'local'
};

if (!isChromeExtension()) {
  console.warn('非Chrome扩展环境预览，部分功能不可用');
}

console.log('Tabify扩展管理界面初始化');

// 在模板模式下，移除加载占位并渲染简单界面，避免卡住
  (function initTemplateUI() {
    if (!document || !document.getElementById) return;
    const root = document.getElementById('__next');
    if (!root) return;
    // 替换加载占位为简易界面
    root.innerHTML = \`
      <div class=\"loading\">\n        <div class=\"spinner\"></div>\n        <p>初始化完成（模板模式）。如需完整界面，请在扩展构建中启用Next静态导出。</p>\n      </div>
    \`;
  })();
`;
  
  const jsPath = path.join(buildDir, 'manager-init.js');
  fs.writeFileSync(jsPath, jsContent, 'utf8');
  console.log('✅ 已创建manager-init.js');
}

/**
 * 生成HTML模板
 * 当Next.js没有生成HTML时，使用此模板
 */
function generateHTMLTemplate() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tabify - 标签页管理器</title>
  <link rel="icon" type="image/png" href="icons/icon32.png">
  <link rel="stylesheet" href="manager-styles.css">
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="logo.png" alt="Tabify" class="logo">
      <div class="title">Tabify - 标签页管理器</div>
    </div>
    <div id="__next">
      <div class="loading">
        <div class="spinner"></div>
        <p>正在初始化应用...</p>
      </div>
    </div>
  </div>
  
  <!-- Chrome扩展桥梁脚本 -->
  <script src="chrome-extension-bridge.js"></script>
  <script src="manager-init.js"></script>
</body>
</html>`;
}

/**
 * 处理HTML内容，使其兼容Chrome扩展
 * 修改路径引用、提取内联脚本、生成安全的CSP策略
 */
function processHTMLForExtension(htmlContent) {
  console.log('🔧 开始处理HTML内容以兼容CSP...');
  
  // 处理Next.js静态资源路径
  // 将 _next/static/ 替换为 nextstatic/static/
  htmlContent = htmlContent.replace(/_next\/static\//g, 'nextstatic/static/');
  
  // 保持对 "/_next/" 的不替换原则，避免破坏如 "/_next/image" 等合法路径
  
  // 修复绝对路径引用 - 确保所有路径都指向nextstatic/static/
  htmlContent = htmlContent.replace(/\/nextstatic\/_next\//g, 'nextstatic/static/');
  htmlContent = htmlContent.replace(/\/nextstatic\/static\//g, 'nextstatic/static/');
  htmlContent = htmlContent.replace(/\/nextstatic\//g, 'nextstatic/');
  // 保留 "_next/" 字符串，避免破坏例如 "/_next/image" 等合法路径
  
  // 修复其他绝对路径为相对路径
  htmlContent = htmlContent.replace(/href="\/([^"*]*\.(css|js|png|jpg|jpeg|gif|svg|ico))"/g, 'href="$1"');
  htmlContent = htmlContent.replace(/src="\/([^"*]*\.(js|png|jpg|jpeg|gif|svg|ico))"/g, 'src="$1"');
  
  // 修复logo和其他资源的绝对路径
  htmlContent = htmlContent.replace(/src="\/logo\.png"/g, 'src="logo.png"');
  
  // 修复webpack路径配置
  htmlContent = htmlContent.replace(/r\.p="\/_next\/"/g, `r.p="${CONFIG.CHROME_STATIC_DIR}/static/"`);
  htmlContent = htmlContent.replace(/r\.p="nextstatic\/static\/"/g, `r.p="${CONFIG.CHROME_STATIC_DIR}/static/"`);
  htmlContent = htmlContent.replace(/r\.p=nextstatic\/static\//g, `r.p=${CONFIG.CHROME_STATIC_DIR}/static/`);
  
  // 替换页面标题为Tabify
  htmlContent = htmlContent.replace(/<title>.*?<\/title>/gi, '<title>Tabify - 标签页管理器</title>');
  
  // 替换外部CSS资源为本地资源
  htmlContent = htmlContent.replace(
    /https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/remixicon\/[\d\.]+\/remixicon\.min\.css/g,
    'assets/remixicon.min.css'
  );
  
  // 提取内联脚本并外部化
  htmlContent = extractAndExternalizeInlineScripts(htmlContent);
  
  // 移除可能导致CSP违规的内联样式和事件处理器
  htmlContent = htmlContent.replace(/\sstyle="[^"]*"/gi, '');
  htmlContent = htmlContent.replace(/\son\w+="[^"]*"/gi, '');
  
  // 在</head>前添加Chrome扩展桥梁脚本引用
  const extensionScriptRef = `
  <!-- Chrome扩展桥梁脚本 -->
  <script src="chrome-extension-bridge.js"></script>
`;
  
  htmlContent = htmlContent.replace('</head>', extensionScriptRef + '</head>');
  
  console.log('✅ HTML内容CSP兼容处理完成');
  return htmlContent;
}

/**
 * 提取内联脚本并外部化
 * 将HTML中的内联脚本提取到独立的JS文件中，并更新HTML引用
 */
function extractAndExternalizeInlineScripts(htmlContent) {
  console.log('📤 提取内联脚本...');
  
  const inlineScripts = [];
  let scriptCounter = 0;
  
  // 匹配所有内联脚本标签
  const inlineScriptRegex = /<script(?![^>]*src=)([^>]*)>([\s\S]*?)<\/script>/gi;
  
  // 提取内联脚本内容
  htmlContent = htmlContent.replace(inlineScriptRegex, (match, attributes, scriptContent) => {
    // 跳过空脚本
    if (!scriptContent.trim()) {
      return match;
    }
    
    // 检查是否是关键的Next.js初始化脚本
    const isNextJSScript = scriptContent.includes('self.__next_f') || 
                          scriptContent.includes('__NEXT_DATA__') ||
                          scriptContent.includes('__webpack_require__');
    
    if (isNextJSScript) {
      scriptCounter++;
      const scriptFileName = `inline-script-${scriptCounter}.js`;
      
      // 保存脚本内容到数组
      inlineScripts.push({
        fileName: scriptFileName,
        content: scriptContent.trim(),
        attributes: attributes
      });
      
      // 替换为外部脚本引用（使用相对路径）
       return `<script src="${scriptFileName}"${attributes}></script>`;
    }
    
    // 对于非关键脚本，直接移除
    console.log('⚠️ 移除非关键内联脚本');
    return '';
  });
  
  // 将提取的脚本写入文件（直接放在build目录下）
   if (inlineScripts.length > 0) {
     const buildDir = CONFIG.BUILD_OUTPUT;
     if (!fs.existsSync(buildDir)) {
       fs.mkdirSync(buildDir, { recursive: true });
     }
     
     inlineScripts.forEach(script => {
       const scriptPath = path.join(buildDir, script.fileName);
       
       // 添加CSP兼容的脚本头部注释
       // 直接写入脚本内容，使用IIFE包装
        const scriptWithHeader = `/**
 * 外部化的内联脚本 - CSP兼容版本
 * 原始属性: ${script.attributes}
 * 生成时间: ${new Date().toISOString()}
 */

// 使用IIFE包装脚本内容
(function() {
  try {
    ${script.content}
  } catch (error) {
    console.error('内联脚本执行错误:', error);
  }
})();`;
       
       fs.writeFileSync(scriptPath, scriptWithHeader, 'utf8');
       console.log(`✅ 已外部化脚本: ${script.fileName}`);
     });
   }
  
  console.log(`📤 共提取了 ${inlineScripts.length} 个内联脚本`);
  return htmlContent;
}

/**
 * 处理CSS和JS资源文件
 * 确保所有资源文件路径正确，并进行必要的优化
 */
async function processAssets() {
  console.log('🎨 处理资源文件...');
  
  try {
    // 处理CSS文件
    await processCSSFiles();
    
    // 处理JS文件
    await processJSFiles();
    
    console.log('✅ 资源文件处理完成');
  } catch (error) {
    throw new Error(`资源文件处理失败: ${error.message}`);
  }
}

/**
 * 处理CSS文件
 * 修复CSS中的路径引用并本地化外部资源
 */
async function processCSSFiles() {
  const cssDir = path.join(CONFIG.BUILD_OUTPUT, CONFIG.CHROME_STATIC_DIR, 'static', 'css');
  
  if (!fs.existsSync(cssDir)) {
    return;
  }
  
  const cssFiles = fs.readdirSync(cssDir).filter(file => file.endsWith('.css'));
  
  for (const file of cssFiles) {
    const filePath = path.join(cssDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 处理外部CDN资源引用
    content = await processExternalCSSResources(content);
    
    // 修复CSS中的路径引用
    content = content.replace(/url\(\//g, 'url(../..');
    
    fs.writeFileSync(filePath, content, 'utf8');
  }
}

/**
 * 处理CSS中的外部资源引用
 * 下载外部资源并替换为本地引用
 */
async function processExternalCSSResources(cssContent) {
  console.log('🔗 处理外部CSS资源引用...');
  
  // 首先处理remixicon的绝对路径引用
  cssContent = cssContent.replace(
    /@import\s+url\(["']?\/remixicon\.min\.css["']?\)/g,
    '@import url("../../../assets/fonts/remixicon.min.css")'
  );
  
  // 匹配@import和url()中的外部资源
  const externalResourceRegex = /@import\s+url\(["']?(https?:\/\/[^"'\)]+)["']?\)|url\(["']?(https?:\/\/[^"'\)]+)["']?\)/g;
  
  let match;
  const downloads = [];
  
  while ((match = externalResourceRegex.exec(cssContent)) !== null) {
    const fullMatch = match[0];
    const url = match[1] || match[2];
    
    if (url) {
      downloads.push({ fullMatch, url });
    }
  }
  
  // 处理每个外部资源
  for (const { fullMatch, url } of downloads) {
    try {
      const fileName = path.basename(url).split('?')[0]; // 移除查询参数
      const localPath = path.join(CONFIG.BUILD_OUTPUT, 'assets', fileName);
      const relativePath = `../../../assets/${fileName}`;
      
      // 确保assets目录存在
      const assetsDir = path.join(CONFIG.BUILD_OUTPUT, 'assets');
      if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
      }
      
      // 下载文件（如果不存在）
      if (!fs.existsSync(localPath)) {
        console.log(`📥 下载外部资源: ${url}`);
        await downloadFile(url, localPath);
        console.log(`✅ 已下载: ${fileName}`);
      }
      
      // 替换CSS中的引用
      if (fullMatch.includes('@import')) {
        cssContent = cssContent.replace(fullMatch, `@import url("${relativePath}");`);
      } else {
        cssContent = cssContent.replace(fullMatch, `url("${relativePath}")`);
      }
      
    } catch (error) {
      console.warn(`⚠️ 无法下载外部资源 ${url}: ${error.message}`);
    }
  }
  
  return cssContent;
}

/**
 * 下载文件到本地
 */
async function downloadFile(url, localPath) {
  const https = require('https');
  const http = require('http');
  
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    
    const file = fs.createWriteStream(localPath);
    
    client.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
      
      file.on('error', (error) => {
        fs.unlink(localPath, () => {}); // 删除部分下载的文件
        reject(error);
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * 处理JS文件
 * 确保JS文件在Chrome扩展环境中正常工作
 */
async function processJSFiles() {
  const jsDir = path.join(CONFIG.BUILD_OUTPUT, CONFIG.CHROME_STATIC_DIR, 'static', 'chunks');
  
  if (!fs.existsSync(jsDir)) {
    return;
  }
  
  console.log('🔧 处理JavaScript文件路径...');
  
  // 递归处理所有JS文件
  const processDirectory = (dir) => {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        processDirectory(filePath);
      } else if (file.endsWith('.js')) {
        try {
          let content = fs.readFileSync(filePath, 'utf8');
          
          // 首先修复硬编码的nextstatic/static/static路径
          content = content.replace(/nextstatic\/static\/static\//g, `${CONFIG.CHROME_STATIC_DIR}/static/`);
          
          // 替换绝对路径引用（谨慎处理，避免误伤 "_next/image" 等）
          // 修复硬编码的重复路径
          content = content.replace(/nextstatic\/static\/static\//g, `${CONFIG.CHROME_STATIC_DIR}/static/`);
          
          // 修复 webpack publicPath 设置（仅处理明确的 publicPath 写法）
          content = content.replace(/r\.p="\/_next\/"/g, `r.p="${CONFIG.CHROME_STATIC_DIR}/static/"`);
          content = content.replace(/r\.p="nextstatic\/static\/"/g, `r.p="${CONFIG.CHROME_STATIC_DIR}/static/"`);
          content = content.replace(/r\.p="\/nextstatic\/static\/"/g, `r.p="${CONFIG.CHROME_STATIC_DIR}/static/"`);
          
          fs.writeFileSync(filePath, content, 'utf8');
        } catch (error) {
          console.warn(`⚠️ 处理JS文件失败 ${filePath}: ${error.message}`);
        }
      }
    }
  };
  
  processDirectory(jsDir);
  
  // 同时处理根目录下的JS文件
  const staticDir = path.join(CONFIG.BUILD_OUTPUT, CONFIG.CHROME_STATIC_DIR, 'static');
  if (fs.existsSync(staticDir)) {
    processDirectory(staticDir);
  }
  
  // 处理内联脚本文件
  const buildDir = CONFIG.BUILD_OUTPUT;
  const inlineScriptFiles = fs.readdirSync(buildDir).filter(file => file.startsWith('inline-script-') && file.endsWith('.js'));
  
  for (const file of inlineScriptFiles) {
    const filePath = path.join(buildDir, file);
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // 处理eval中的路径引用
      content = content.replace(/"static\/chunks\//g, `"${CONFIG.CHROME_STATIC_DIR}/static/chunks/`);
      content = content.replace(/"static\/css\//g, `"${CONFIG.CHROME_STATIC_DIR}/static/css/`);
      content = content.replace(/"static\/media\//g, `"${CONFIG.CHROME_STATIC_DIR}/static/media/`);
      
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ 已处理内联脚本: ${file}`);
    } catch (error) {
      console.warn(`⚠️ 处理内联脚本失败 ${file}: ${error.message}`);
    }
  }
  
  console.log('✅ JavaScript文件路径处理完成');
}

/**
 * 创建Chrome扩展桥梁脚本
 * 从TypeScript源文件创建JavaScript版本的扩展桥梁
 */
async function createExtensionBridge() {
  console.log('🌉 创建Chrome扩展桥梁脚本...');
  
  try {
    // 创建简化版的扩展桥梁脚本
    const bridgeScript = `
/**
 * Chrome扩展桥梁脚本
 * 提供扩展环境检测和基础通信功能
 */

// 全局扩展桥梁对象
window.ExtensionBridge = {
  isInitialized: false,
  
  // 检测是否在Chrome扩展环境中
  isChromeExtension: function() {
    try {
      return typeof chrome !== 'undefined' && 
             !!chrome.runtime && 
             !!chrome.runtime.id && 
             !!chrome.storage && 
             !!chrome.storage.local;
    } catch (error) {
      return false;
    }
  },
  
  // 初始化扩展桥梁
  initialize: function() {
    if (this.isInitialized) {
      return Promise.resolve();
    }
    
    console.log('ExtensionBridge: 初始化开始');
    
    if (this.isChromeExtension()) {
      console.log('ExtensionBridge: Chrome扩展环境检测成功');
    } else {
      console.log('ExtensionBridge: 非Chrome扩展环境，使用本地模式');
    }
    
    this.isInitialized = true;
    console.log('ExtensionBridge: 初始化完成');
    
    return Promise.resolve();
  },
  
  // 发送消息到后台脚本
  sendMessage: function(message) {
    return new Promise((resolve, reject) => {
      if (!this.isChromeExtension()) {
        reject(new Error('不在Chrome扩展环境中'));
        return;
      }
      
      try {
        chrome.runtime.sendMessage(message, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  },
  
  // 获取存储数据
  getStorageData: function(keys) {
    return new Promise((resolve, reject) => {
      if (!this.isChromeExtension()) {
        // 非扩展环境，返回模拟数据
        resolve({ tabs: [], groups: [] });
        return;
      }
      
      try {
        chrome.storage.local.get(keys, (result) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(result);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }
};

// 全局初始化函数
window.initializeExtensionBridge = function() {
  return window.ExtensionBridge.initialize();
};

// 获取扩展桥梁实例
window.getExtensionBridge = function() {
  return window.ExtensionBridge;
};

// 环境检测函数
window.isChromeExtensionEnvironment = function() {
  return window.ExtensionBridge.isChromeExtension();
};

// 自动初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    window.ExtensionBridge.initialize();
  });
} else {
  window.ExtensionBridge.initialize();
}

console.log('Chrome扩展桥梁脚本已加载');
`;
    
    // 写入桥梁脚本文件
    const bridgePath = path.join(CONFIG.BUILD_OUTPUT, 'chrome-extension-bridge.js');
    fs.writeFileSync(bridgePath, bridgeScript, 'utf8');
    console.log('✅ Chrome扩展桥梁脚本已创建');
    
  } catch (error) {
    throw new Error(`Chrome扩展桥梁创建失败: ${error.message}`);
  }
}

/**
 * 复制扩展文件
 * 将manifest.json、background.js等必要的扩展文件复制到构建目录
 */
async function copyExtensionFiles() {
  console.log('📦 复制扩展文件...');

  try {
    // 首先创建扩展桥梁脚本
    await createExtensionBridge();

    // 复制并处理manifest.json文件
    await copyAndProcessManifest();

    // 复制其他扩展文件
    const extensionFiles = [
      'background.js'
    ];

    extensionFiles.forEach(file => {
      const sourcePath = path.join(CONFIG.EXTENSION_DIR, file);
      const targetPath = path.join(CONFIG.BUILD_OUTPUT, file);

      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`✅ 已复制: ${file}`);

        // 修复background.js中的路径问题
        if (file === 'background.js') {
          fixBackgroundJSPaths(targetPath);
        }
      } else {
        console.warn(`⚠️ 文件不存在: ${file}`);
      }
    });

    // 复制图标目录
    const iconsDir = path.join(CONFIG.EXTENSION_DIR, 'icons');
    const targetIconsDir = path.join(CONFIG.BUILD_OUTPUT, 'icons');

    if (fs.existsSync(iconsDir)) {
      copyDirectory(iconsDir, targetIconsDir);
      console.log('✅ 已复制图标目录');
    }

    // 复制logo文件
    const logoFiles = ['logo.png'];
    logoFiles.forEach(file => {
      const sourcePath = path.join(CONFIG.SOURCE_DIR, '..', file);
      const targetPath = path.join(CONFIG.BUILD_OUTPUT, file);

      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`✅ 已复制: ${file}`);
      }
    });

    // 复制assets目录（包含字体文件等资源）
    const assetsDir = path.join(CONFIG.SOURCE_DIR, 'assets');
    const targetAssetsDir = path.join(CONFIG.BUILD_OUTPUT, 'assets');

    if (fs.existsSync(assetsDir)) {
      copyDirectory(assetsDir, targetAssetsDir);
      console.log('✅ 已复制assets目录（包含字体文件）');
    } else {
      console.warn('⚠️ assets目录不存在');
    }

    console.log('✅ 扩展文件复制完成');
  } catch (error) {
    throw new Error(`扩展文件复制失败: ${error.message}`);
  }
}


/**
 * 修复background.js中的路径问题
 * 将build/manager.html和build/icons路径修复为相对路径
 */
function fixBackgroundJSPaths(backgroundJSPath) {
  console.log('🔧 修复background.js路径问题...');

  try {
    let content = fs.readFileSync(backgroundJSPath, 'utf8');

    // 修复manager.html的路径
    content = content.replace(
      /chrome\.runtime\.getURL\('build\/manager\.html'\)/g,
      "chrome.runtime.getURL('manager.html')"
    );

    // 修复管理界面检测路径
    content = content.replace(
      /chrome\.runtime\.getURL\('build\/manager\.html'\)/g,
      "chrome.runtime.getURL('manager.html')"
    );

    // 修复图标路径（如果有的话）
    content = content.replace(
      /iconUrl: 'build\/icons\/icon48\.png'/g,
      "iconUrl: 'icons/icon48.png'"
    );

    fs.writeFileSync(backgroundJSPath, content, 'utf8');
    console.log('✅ background.js路径修复完成');
  } catch (error) {
    console.error('❌ background.js路径修复失败:', error.message);
  }
}

/**
 * 复制并处理manifest.json文件
 * 自动生成安全的CSP策略
 */
async function copyAndProcessManifest() {
  console.log('🔒 处理manifest.json并生成安全CSP策略...');

  const sourcePath = path.join(CONFIG.EXTENSION_DIR, 'manifest.json');
  const targetPath = path.join(CONFIG.BUILD_OUTPUT, 'manifest.json');

  if (!fs.existsSync(sourcePath)) {
    throw new Error('manifest.json文件不存在');
  }

  // 读取原始manifest.json
  const manifestContent = fs.readFileSync(sourcePath, 'utf8');
  const manifest = JSON.parse(manifestContent);

  // 修复路径：去掉build/前缀，因为在build目录中的manifest使用相对路径
  if (manifest.action && manifest.action.default_popup) {
    manifest.action.default_popup = manifest.action.default_popup.replace('build/', '');
    console.log('✅ 已修复popup路径');
  }

  if (manifest.background && manifest.background.service_worker) {
    manifest.background.service_worker = manifest.background.service_worker.replace('build/', '');
    console.log('✅ 已修复service_worker路径');
  }

  if (manifest.options_page) {
    manifest.options_page = manifest.options_page.replace('build/', '');
    console.log('✅ 已修复options_page路径');
  }

  // 修复图标路径
  if (manifest.action && manifest.action.default_icon) {
    Object.keys(manifest.action.default_icon).forEach(size => {
      manifest.action.default_icon[size] = manifest.action.default_icon[size].replace('build/', '');
    });
    console.log('✅ 已修复action图标路径');
  }

  if (manifest.icons) {
    Object.keys(manifest.icons).forEach(size => {
      manifest.icons[size] = manifest.icons[size].replace('build/', '');
    });
    console.log('✅ 已修复扩展图标路径');
  }

  // 修复web_accessible_resources路径
  if (manifest.web_accessible_resources && manifest.web_accessible_resources[0]) {
    manifest.web_accessible_resources[0].resources = manifest.web_accessible_resources[0].resources.map(resource =>
      resource.replace('build/*', '*')
    );
    console.log('✅ 已修复web_accessible_resources路径');
  }

  // 生成安全的CSP策略
  const secureCSP = generateSecureCSPPolicy();

  // 更新CSP配置
  if (manifest.content_security_policy && manifest.content_security_policy.extension_pages) {
    manifest.content_security_policy.extension_pages = secureCSP;
    console.log('✅ 已更新extension_pages CSP策略');
  }

  // 写入处理后的manifest.json
  fs.writeFileSync(targetPath, JSON.stringify(manifest, null, 2), 'utf8');
  console.log('✅ manifest.json处理完成，路径已修复，CSP策略已优化');
}

/**
 * 生成安全的CSP策略
 * 移除unsafe-inline，保留必要的指令
 */
function generateSecureCSPPolicy() {
  console.log('🛡️ 生成安全的CSP策略...');
  
  // 基础安全策略
  const cspDirectives = {
    'script-src': ["'self'", "'wasm-unsafe-eval'"],
    'style-src': ["'self'"],
    'img-src': ["'self'", 'data:', 'chrome-extension:', 'https:', 'http:'],
    'font-src': ["'self'", 'data:'],
    'connect-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"]
  };
  
  // 构建CSP字符串
  const cspString = Object.entries(cspDirectives)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
  
  console.log('🛡️ 生成的CSP策略:', cspString);
  return cspString;
}

/**
 * 验证构建结果
 * 检查构建输出是否完整和正确
 */
async function validateBuild() {
  console.log('🔍 验证构建结果...');
  
  const requiredFiles = [
    { file: 'manifest.json', dir: CONFIG.BUILD_OUTPUT },
    { file: 'background.js', dir: CONFIG.BUILD_OUTPUT },
    { file: 'manager.html', dir: CONFIG.BUILD_OUTPUT },
    { file: 'settings.html', dir: CONFIG.BUILD_OUTPUT },
    { file: 'import-export.html', dir: CONFIG.BUILD_OUTPUT }
  ];
  
  const missingFiles = [];
  
  requiredFiles.forEach(({ file, dir }) => {
    const filePath = path.join(dir, file);
    if (!fs.existsSync(filePath)) {
      missingFiles.push(file);
    }
  });
  
  if (missingFiles.length > 0) {
    throw new Error(`缺少必要文件: ${missingFiles.join(', ')}`);
  }
  
  console.log('✅ 构建结果验证通过');
}

/**
 * 递归复制目录
 * 工具函数：复制整个目录及其内容
 */
function copyDirectory(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }
  
  const items = fs.readdirSync(source);
  
  items.forEach(item => {
    const sourcePath = path.join(source, item);
    const targetPath = path.join(target, item);
    
    if (fs.statSync(sourcePath).isDirectory()) {
      copyDirectory(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  });
}

// 错误处理
process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的Promise拒绝:', reason);
  process.exit(1);
});

// 如果直接运行此脚本，执行构建
if (require.main === module) {
  buildExtension();
}

/**
 * 后置JavaScript语法校验
 *
 * 目的：在扩展构建完成后，对构建输出目录中的所有 .js 文件进行语法验证，
 * 以捕获潜在的语法错误（例如括号遗漏、字符串拼接错误等），避免在浏览器环境中抛错。
 *
 * 实现方式：使用 Node.js 的 vm.Script 来进行纯语法编译，不执行代码逻辑，
 * 因此不会引入运行时副作用。收集所有错误并输出详细报告。
 *
 * 校验范围：
 * - nextstatic/static 下的所有 chunks、runtime、css附属js
 * - 构建根目录下的 inline-script-*.js、background.js、chrome-extension-bridge.js
 *
 * 报告输出：在构建目录生成 build_syntax_report.json，包含错误文件、行列、上下文片段。
 */
async function validateJavaScriptSyntax() {
  const vm = require('vm');
  const buildDir = CONFIG.BUILD_OUTPUT;

  /**
   * 收集构建目录中的所有JS文件（递归）
   * @returns {string[]} JS文件的绝对路径列表
   */
  function collectJSFiles() {
    const results = [];

    /**
     * 递归遍历目录并收集 .js 文件
     * @param {string} dir - 目录路径
     */
    function walk(dir) {
      if (!fs.existsSync(dir)) return;
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          walk(fullPath);
        } else if (item.endsWith('.js')) {
          results.push(fullPath);
        }
      }
    }

    // 主要目录：构建根、nextstatic/static（含chunks）
    walk(buildDir);
    walk(path.join(buildDir, CONFIG.CHROME_STATIC_DIR, 'static'));
    walk(path.join(buildDir, CONFIG.CHROME_STATIC_DIR, 'static', 'chunks'));

    return results;
  }

  /**
   * 提取错误位置附近的代码片段
   * @param {string} content - 文件内容
   * @param {number} line - 错误行号（1-based）
   * @param {number} col - 错误列号（1-based）
   * @returns {string} 上下文片段
   */
  function getSnippet(content, line, col) {
    const lines = content.split(/\r?\n/);
    const start = Math.max(0, (line || 1) - 3);
    const end = Math.min(lines.length, (line || 1) + 2);
    const snippetLines = lines.slice(start, end);
    const pointerLineIndex = (line || 1) - 1 - start;
    if (pointerLineIndex >= 0 && pointerLineIndex < snippetLines.length) {
      const pointer = '-'.repeat(Math.max(0, (col || 1) - 1)) + '^';
      snippetLines[pointerLineIndex] += `\n${pointer}`;
    }
    return snippetLines.join('\n');
  }

  /**
   * 从错误对象中获取行列信息
   * @param {Error} err - 错误对象
   * @param {string} filePath - 文件路径，用于stack解析
   * @returns {{line:number|undefined, col:number|undefined}}
   */
  function getErrorLocation(err, filePath) {
    const loc = { line: undefined, col: undefined };
    if (typeof err.lineNumber === 'number') loc.line = err.lineNumber;
    if (typeof err.columnNumber === 'number') loc.col = err.columnNumber;
    if ((loc.line == null || loc.col == null) && err.stack) {
      const escaped = filePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`${escaped}:(\\d+):(\\d+)`);
      const m = err.stack.match(re);
      if (m) {
        loc.line = parseInt(m[1], 10);
        loc.col = parseInt(m[2], 10);
      }
    }
    return loc;
  }

  console.log('🧪 执行后置JS语法校验...');
  const files = collectJSFiles();
  const errors = [];

  for (const file of files) {
    try {
      const code = fs.readFileSync(file, 'utf8');
      // 使用 vm.Script 仅编译语法，不执行
      new vm.Script(code, { filename: file, displayErrors: true });
    } catch (err) {
      const code = fs.readFileSync(file, 'utf8');
      const loc = getErrorLocation(err, file);
      errors.push({
        file,
        message: err.message,
        line: loc.line,
        column: loc.col,
        snippet: getSnippet(code, loc.line, loc.col)
      });
      console.warn(`❌ 语法错误: ${file} -> ${err.message}`);
    }
  }

  const reportPath = path.join(buildDir, 'build_syntax_report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    checkedFiles: files.length,
    errorCount: errors.length,
    errors
  }, null, 2), 'utf8');

  if (errors.length > 0) {
    throw new Error(`语法校验失败: ${errors.length} 个文件存在错误。详见 ${reportPath}`);
  }
  console.log('✅ 后置JS语法校验通过');
}

module.exports = {
  buildExtension,
  CONFIG
};