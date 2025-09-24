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
    execSync('npm run build', {
      cwd: CONFIG.SOURCE_DIR,
      stdio: 'inherit'
    });
    
    console.log('✅ Next.js应用构建完成');
  } catch (error) {
    throw new Error(`Next.js构建失败: ${error.message}`);
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
    } else {
      // 如果没有找到Next.js输出，使用模板生成
      console.warn('⚠️ 未找到Next.js构建输出，使用HTML模板');
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
  <style>
    body {
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
  </style>
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
  
  <script>
    // 基础错误处理
    window.onerror = function(msg, url, line, col, error) {
      console.error('页面错误:', msg, 'at', url + ':' + line);
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error';
      errorDiv.innerHTML = '<strong>加载错误:</strong> ' + msg;
      document.getElementById('__next').appendChild(errorDiv);
    };
    
    // Chrome扩展环境配置
    window.TABIFY_CONFIG = {
      isExtension: true,
      version: '1.0.0',
      apiEndpoint: chrome.runtime.getURL(''),
      storageType: 'chrome'
    };
    
    console.log('Tabify扩展管理界面初始化');
  </script>
</body>
</html>`;
}

/**
 * 处理HTML内容，使其兼容Chrome扩展
 * 修改路径引用、提取内联脚本、生成安全的CSP策略
 */
function processHTMLForExtension(htmlContent) {
  console.log('🔧 开始处理HTML内容以兼容CSP...');
  
  // 将_next路径替换为Chrome兼容的路径
  htmlContent = htmlContent.replace(/_next\//g, `${CONFIG.CHROME_STATIC_DIR}/`);
  htmlContent = htmlContent.replace(/"_next\//g, `"${CONFIG.CHROME_STATIC_DIR}/`);
  htmlContent = htmlContent.replace(/'_next\//g, `'${CONFIG.CHROME_STATIC_DIR}/`);
  
  // 修复绝对路径为相对路径（仅处理nextstatic路径）
  htmlContent = htmlContent.replace(/href="\/nextstatic\//g, 'href="nextstatic/');
  htmlContent = htmlContent.replace(/src="\/nextstatic\//g, 'src="nextstatic/');
  
  // 修复其他可能的绝对路径问题
  htmlContent = htmlContent.replace(/href="\/static\//g, 'href="nextstatic/static/');
  htmlContent = htmlContent.replace(/src="\/static\//g, 'src="nextstatic/static/');
  
  // 修复logo和其他资源的绝对路径
  htmlContent = htmlContent.replace(/src="\/logo\.png"/g, 'src="logo.png"');
  htmlContent = htmlContent.replace(/href="\/([^"]*\.(css|js|png|jpg|jpeg|gif|svg|ico))"/g, 'href="$1"');
  htmlContent = htmlContent.replace(/src="\/([^"]*\.(js|png|jpg|jpeg|gif|svg|ico))"/g, 'src="$1"');
  
  // 修复webpack路径配置
  htmlContent = htmlContent.replace(/r\.p="\/_next\/"/g, `r.p="${CONFIG.CHROME_STATIC_DIR}/"`);
  
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
       const scriptWithHeader = `/**
 * 外部化的内联脚本 - CSP兼容版本
 * 原始属性: ${script.attributes}
 * 生成时间: ${new Date().toISOString()}
 */\n\n${script.content}`;
       
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
  
  // 这里可以添加JS文件的特殊处理逻辑
  // 例如：移除不兼容的代码、添加扩展特定的polyfill等
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
    
    console.log('✅ 扩展文件复制完成');
  } catch (error) {
    throw new Error(`扩展文件复制失败: ${error.message}`);
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
  
  // 生成安全的CSP策略
  const secureCSP = generateSecureCSPPolicy();
  
  // 更新CSP配置
  if (manifest.content_security_policy && manifest.content_security_policy.extension_pages) {
    manifest.content_security_policy.extension_pages = secureCSP;
    console.log('✅ 已更新extension_pages CSP策略');
  }
  
  // 写入处理后的manifest.json
  fs.writeFileSync(targetPath, JSON.stringify(manifest, null, 2), 'utf8');
  console.log('✅ manifest.json处理完成，CSP策略已优化');
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
    'img-src': ["'self'", 'data:', 'chrome-extension:'],
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
    'manifest.json',
    'background.js',
    'manager.html'
  ];
  
  const missingFiles = [];
  
  requiredFiles.forEach(file => {
    const filePath = path.join(CONFIG.BUILD_OUTPUT, file);
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

module.exports = {
  buildExtension,
  CONFIG
};